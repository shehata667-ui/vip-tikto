package com.tiktokstudio.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.FFmpegKitConfig;
import com.arthenica.ffmpegkit.FFprobeKit;
import com.arthenica.ffmpegkit.MediaInformation;
import com.arthenica.ffmpegkit.MediaInformationSession;
import com.arthenica.ffmpegkit.ReturnCode;
import com.arthenica.ffmpegkit.StreamInformation;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Iterator;

@CapacitorPlugin(name = "FFmpegEngine")
public class FFmpegPlugin extends Plugin {

    private File exportsDir() {
        File base = getContext().getExternalFilesDir(null);
        if (base == null) base = getContext().getFilesDir();
        File d = new File(base, "exports");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private File subCache(String name) {
        File d = new File(getContext().getCacheDir(), name);
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private static String safeName(String n) {
        if (n == null || n.isEmpty()) return "file";
        return n.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private static void copy(InputStream in, OutputStream out) throws Exception {
        byte[] buf = new byte[256 * 1024];
        int r;
        while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
        out.flush();
    }

    // ---------------------------------------------------------------- status
    @PluginMethod
    public void status(PluginCall call) {
        JSObject o = new JSObject();
        try {
            String v = FFmpegKitConfig.getFFmpegVersion();
            o.put("available", true);
            o.put("version", v == null ? "" : v);
        } catch (Throwable t) {
            o.put("available", false);
            o.put("version", "");
            o.put("error", String.valueOf(t));
        }
        o.put("exportsDir", exportsDir().getAbsolutePath());
        o.put("overlaysDir", subCache("overlays").getAbsolutePath());
        call.resolve(o);
    }

    // ------------------------------------------------------------- pickVideo
    @PluginMethod
    public void pickVideo(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("video/*");
        startActivityForResult(call, i, "pickVideoResult");
    }

    @ActivityCallback
    private void pickVideoResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK
                || result.getData() == null
                || result.getData().getData() == null) {
            call.reject("cancelled");
            return;
        }
        final Uri uri = result.getData().getData();
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                String name = "video.mp4";
                Cursor c = cr.query(uri, null, null, null, null);
                if (c != null) {
                    try {
                        int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        if (idx >= 0 && c.moveToFirst()) name = c.getString(idx);
                    } finally {
                        c.close();
                    }
                }
                File dir = subCache("inputs");
                File[] old = dir.listFiles();
                if (old != null) for (File f : old) f.delete();

                File dest = new File(dir, System.currentTimeMillis() + "_" + safeName(name));
                try (InputStream in = cr.openInputStream(uri);
                     FileOutputStream out = new FileOutputStream(dest)) {
                    if (in == null) throw new Exception("تعذر فتح الملف");
                    copy(in, out);
                }
                JSObject o = new JSObject();
                o.put("path", dest.getAbsolutePath());
                o.put("name", name);
                o.put("size", dest.length());
                call.resolve(o);
            } catch (Exception e) {
                call.reject("فشل قراءة الفيديو: " + e.getMessage());
            }
        }).start();
    }

    // ----------------------------------------------------------------- probe
    private static double fraction(String s) {
        try {
            if (s == null) return 0;
            if (s.contains("/")) {
                String[] p = s.split("/");
                double d = Double.parseDouble(p[1]);
                return d == 0 ? 0 : Double.parseDouble(p[0]) / d;
            }
            return Double.parseDouble(s);
        } catch (Exception e) {
            return 0;
        }
    }

    @PluginMethod
    public void probe(PluginCall call) {
        final String path = call.getString("path");
        new Thread(() -> {
            try {
                MediaInformationSession s = FFprobeKit.getMediaInformation(path);
                MediaInformation info = s.getMediaInformation();
                if (info == null) {
                    call.reject("تعذر قراءة معلومات الفيديو");
                    return;
                }
                JSObject o = new JSObject();
                double dur = 0;
                try { dur = Double.parseDouble(info.getDuration()); } catch (Exception ignored) {}
                long size = 0;
                try { size = Long.parseLong(info.getSize()); } catch (Exception ignored) {}
                long br = 0;
                try { br = Long.parseLong(info.getBitrate()); } catch (Exception ignored) {}
                o.put("duration", dur);
                o.put("sizeBytes", size);
                o.put("bitrate", br);

                JSArray tags = new JSArray();
                JSONObject t = info.getTags();
                if (t != null) {
                    Iterator<String> it = t.keys();
                    while (it.hasNext()) tags.put(it.next());
                }
                o.put("tags", tags);

                long w = 0, h = 0;
                double fps = 0;
                boolean audio = false;
                int rotation = 0;
                if (info.getStreams() != null) {
                    for (StreamInformation st : info.getStreams()) {
                        String type = st.getType();
                        if ("audio".equals(type)) audio = true;
                        if ("video".equals(type) && w == 0) {
                            if (st.getWidth() != null) w = st.getWidth();
                            if (st.getHeight() != null) h = st.getHeight();
                            fps = fraction(st.getAverageFrameRate());
                            if (fps <= 0) fps = fraction(st.getRealFrameRate());
                            try {
                                JSONObject props = st.getAllProperties();
                                if (props != null) {
                                    JSONArray sd = props.optJSONArray("side_data_list");
                                    if (sd != null) {
                                        for (int k = 0; k < sd.length(); k++) {
                                            JSONObject e = sd.optJSONObject(k);
                                            if (e != null && e.has("rotation")) rotation = e.optInt("rotation");
                                        }
                                    }
                                    JSONObject st2 = props.optJSONObject("tags");
                                    if (st2 != null && st2.has("rotate")) {
                                        rotation = Integer.parseInt(st2.optString("rotate", "0"));
                                    }
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                }
                int r = Math.abs(rotation) % 180;
                if (r == 90) { long tmp = w; w = h; h = tmp; }
                o.put("width", w);
                o.put("height", h);
                o.put("fps", fps);
                o.put("hasAudio", audio);
                call.resolve(o);
            } catch (Throwable e) {
                call.reject("فشل فحص الفيديو: " + e);
            }
        }).start();
    }

    // --------------------------------------------------------------- execute
    @PluginMethod
    public void execute(PluginCall call) {
        JSArray arr = call.getArray("args");
        if (arr == null) {
            call.reject("args مفقودة");
            return;
        }
        final String[] args;
        try {
            args = new String[arr.length()];
            for (int i = 0; i < args.length; i++) args[i] = String.valueOf(arr.get(i));
        } catch (Exception e) {
            call.reject("args غير صالحة");
            return;
        }
        try {
            FFmpegKit.executeWithArgumentsAsync(args,
                    session -> {
                        ReturnCode rc = session.getReturnCode();
                        JSObject r = new JSObject();
                        r.put("success", ReturnCode.isSuccess(rc));
                        r.put("cancelled", ReturnCode.isCancel(rc));
                        r.put("returnCode", rc == null ? -1 : rc.getValue());
                        String out = session.getAllLogsAsString();
                        if (out == null) out = "";
                        if (out.length() > 200000) out = out.substring(out.length() - 200000);
                        r.put("output", out);
                        call.resolve(r);
                    },
                    log -> { },
                    stats -> {
                        JSObject e = new JSObject();
                        e.put("timeMs", (long) stats.getTime());
                        notifyListeners("progress", e);
                    });
        } catch (Throwable t) {
            call.reject("تعذر تشغيل FFmpeg: " + t);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        try { FFmpegKit.cancel(); } catch (Throwable ignored) {}
        call.resolve();
    }

    // ------------------------------------------------------------ file utils
    @PluginMethod
    public void writeBase64(PluginCall call) {
        try {
            String name = safeName(call.getString("name"));
            String data = call.getString("data", "");
            int comma = data.indexOf(',');
            if (comma >= 0) data = data.substring(comma + 1);
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            File f = new File(subCache("overlays"), name);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(bytes); }
            JSObject o = new JSObject();
            o.put("path", f.getAbsolutePath());
            call.resolve(o);
        } catch (Exception e) {
            call.reject("فشل حفظ الصورة: " + e.getMessage());
        }
    }

    @PluginMethod
    public void fileSize(PluginCall call) {
        File f = new File(call.getString("path", ""));
        JSObject o = new JSObject();
        o.put("size", f.exists() ? f.length() : 0);
        call.resolve(o);
    }

    @PluginMethod
    public void cleanup(PluginCall call) {
        String prefix = safeName(call.getString("prefix", ""));
        File[] files = subCache("overlays").listFiles();
        if (files != null && !prefix.isEmpty()) {
            for (File f : files) if (f.getName().startsWith(prefix)) f.delete();
        }
        call.resolve();
    }

    // ---------------------------------------------------------- gallery/share
    @PluginMethod
    public void saveToGallery(PluginCall call) {
        final String path = call.getString("path");
        final String name = safeName(call.getString("name", "tiktok_video.mp4"));
        new Thread(() -> {
            try {
                File src = new File(path);
                if (!src.exists()) throw new Exception("الملف غير موجود");
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContext().getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Video.Media.DISPLAY_NAME, name);
                    v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
                    v.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/TikTokStudio");
                    v.put(MediaStore.Video.Media.IS_PENDING, 1);
                    Uri col = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    Uri uri = cr.insert(col, v);
                    if (uri == null) throw new Exception("تعذر إنشاء الملف في المعرض");
                    try (java.io.FileInputStream in = new java.io.FileInputStream(src);
                         OutputStream out = cr.openOutputStream(uri)) {
                        if (out == null) throw new Exception("تعذر الكتابة في المعرض");
                        copy(in, out);
                    }
                    v.clear();
                    v.put(MediaStore.Video.Media.IS_PENDING, 0);
                    cr.update(uri, v, null, null);
                    JSObject o = new JSObject();
                    o.put("uri", uri.toString());
                    call.resolve(o);
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "TikTokStudio");
                    if (!dir.exists()) dir.mkdirs();
                    File dest = new File(dir, name);
                    try (java.io.FileInputStream in = new java.io.FileInputStream(src);
                         FileOutputStream out = new FileOutputStream(dest)) {
                        copy(in, out);
                    }
                    MediaScannerConnection.scanFile(getContext(), new String[]{dest.getAbsolutePath()}, new String[]{"video/mp4"}, null);
                    JSObject o = new JSObject();
                    o.put("uri", dest.getAbsolutePath());
                    call.resolve(o);
                }
            } catch (Exception e) {
                call.reject("فشل الحفظ في المعرض: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void shareVideo(PluginCall call) {
        try {
            File f = new File(call.getString("path", ""));
            if (!f.exists()) { call.reject("الملف غير موجود"); return; }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent s = new Intent(Intent.ACTION_SEND);
            s.setType("video/mp4");
            s.putExtra(Intent.EXTRA_STREAM, uri);
            s.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(s, "مشاركة الفيديو");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("فشلت المشاركة: " + e.getMessage());
        }
    }
}
