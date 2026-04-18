package com.tranquiliways.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(
    name = "TranquiliNative",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class TranquiliNativePlugin extends Plugin {

    private static final String AUDIO_PERMISSION_ALIAS = "audio";
    private static final String DEFAULT_LANGUAGE = "pt-BR";
    private static final String DEFAULT_PROMPT = "Fale seu TranquiliWay";

    @PluginMethod
    public void transcribeOnce(PluginCall call) {
        if (getPermissionState(AUDIO_PERMISSION_ALIAS) != PermissionState.GRANTED) {
            requestPermissionForAlias(AUDIO_PERMISSION_ALIAS, call, "handleAudioPermission");
            return;
        }

        startSpeechRecognition(call);
    }

    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        String rawUrl = call.getString("url");

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            call.reject("Informe uma URL valida para abrir o Unity.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(rawUrl));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);

        try {
          getActivity().startActivity(intent);

          JSObject result = new JSObject();
          result.put("opened", true);
          result.put("url", rawUrl);
          call.resolve(result);
        } catch (ActivityNotFoundException error) {
          call.reject("Nenhum app compativel foi encontrado para abrir esta URL.");
        } catch (Exception error) {
          call.reject("Nao foi possivel abrir o Unity neste dispositivo.");
        }
    }

    @PermissionCallback
    private void handleAudioPermission(PluginCall call) {
        if (call == null) {
            return;
        }

        if (getPermissionState(AUDIO_PERMISSION_ALIAS) != PermissionState.GRANTED) {
            call.reject("O acesso ao microfone foi negado.");
            return;
        }

        startSpeechRecognition(call);
    }

    @ActivityCallback
    private void handleSpeechRecognitionResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            call.reject("A captura de voz foi cancelada.");
            return;
        }

        Intent data = result.getData();

        if (data == null) {
            call.reject("Nenhuma fala foi retornada pelo Android.");
            return;
        }

        ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);

        if (matches == null || matches.isEmpty()) {
            call.reject("Nenhuma fala foi reconhecida.");
            return;
        }

        String transcript = matches.get(0);

        if (transcript == null || transcript.trim().isEmpty()) {
            call.reject("Nenhuma fala foi reconhecida.");
            return;
        }

        JSObject resultPayload = new JSObject();
        resultPayload.put("transcript", transcript.trim());
        call.resolve(resultPayload);
    }

    private void startSpeechRecognition(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        String language = call.getString("language", DEFAULT_LANGUAGE);
        String prompt = call.getString("prompt", DEFAULT_PROMPT);

        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);

        try {
            startActivityForResult(call, intent, "handleSpeechRecognitionResult");
        } catch (ActivityNotFoundException error) {
            call.reject("O reconhecimento de voz nao esta disponivel neste dispositivo.");
        } catch (Exception error) {
            call.reject("Nao foi possivel iniciar o reconhecimento de voz.");
        }
    }
}
