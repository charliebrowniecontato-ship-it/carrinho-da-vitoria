package com.carrinhodavitoria.gestao;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.OutputStream;
import java.util.ArrayList;

public final class MainActivity extends Activity {
    private static final int PURPLE=Color.rgb(74,0,76), PAPER=Color.rgb(250,247,251), YELLOW=Color.rgb(255,216,61);
    private static final int PICK_IMAGES=41, SAVE_CSV=42;
    private WebView web;
    private LinearLayout root, navigation, splash, error;
    private ProgressBar progress;
    private TextView errorDescription;
    private final Button[] tabs=new Button[2];
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingCsv;
    private String lastUrl=NavigationPolicy.ENTRY;
    private boolean failed;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if(Build.VERSION.SDK_INT>=30) getWindow().setDecorFitsSystemWindows(false);
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(PAPER);
        root.setOnApplyWindowInsetsListener((view,insets)->{
            int left,right,top,bottom,keyboard=0;
            if(Build.VERSION.SDK_INT>=30) {
                android.graphics.Insets system=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
                left=system.left;right=system.right;top=system.top;bottom=system.bottom;keyboard=insets.getInsets(WindowInsets.Type.ime()).bottom;
            } else {left=insets.getSystemWindowInsetLeft();right=insets.getSystemWindowInsetRight();top=insets.getSystemWindowInsetTop();bottom=insets.getSystemWindowInsetBottom();if(bottom>dp(130))keyboard=bottom;}
            view.setPadding(left,top,right,Math.max(bottom,keyboard));
            if(navigation!=null)navigation.setVisibility(keyboard>dp(100)?View.GONE:View.VISIBLE);
            return insets;
        });
        setContentView(root);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        getWindow().setStatusBarColor(Color.TRANSPARENT);getWindow().setNavigationBarColor(Color.TRANSPARENT);
        FrameLayout content=new FrameLayout(this);root.addView(content,new LinearLayout.LayoutParams(-1,0,1));
        web=new WebView(this);web.setBackgroundColor(PAPER);content.addView(web,new FrameLayout.LayoutParams(-1,-1));configureWebView();
        splash=brand(true);
        TextView loading=text("Preparando nosso carrinho…",15,Color.WHITE);loading.setPadding(0,dp(14),0,dp(22));splash.addView(loading);
        ProgressBar spinner=new ProgressBar(this);spinner.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(YELLOW));splash.addView(spinner,new LinearLayout.LayoutParams(dp(27),dp(27)));content.addView(splash,new FrameLayout.LayoutParams(-1,-1));
        error=brand(false);TextView title=text("Vamos tentar de novo?",24,PURPLE);title.setPadding(0,dp(24),0,dp(12));error.addView(title);
        errorDescription=text("Confira sua conexão para acessar a gestão.",14,PURPLE);errorDescription.setLineSpacing(dp(5),1);error.addView(errorDescription);
        Button retry=button("Tentar novamente",YELLOW,PURPLE);LinearLayout.LayoutParams retryParams=new LinearLayout.LayoutParams(-1,dp(52));retryParams.topMargin=dp(24);error.addView(retry,retryParams);retry.setOnClickListener(v->navigate(lastUrl));
        TextView home=text("Voltar para a gestão",14,PURPLE);home.setPadding(0,dp(20),0,dp(12));home.setOnClickListener(v->navigate(NavigationPolicy.ENTRY));error.addView(home);
        error.setVisibility(View.GONE);content.addView(error,new FrameLayout.LayoutParams(-1,-1));
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);progress.setProgressTintList(android.content.res.ColorStateList.valueOf(PURPLE));content.addView(progress,new FrameLayout.LayoutParams(-1,dp(3),Gravity.TOP));
        navigation=new LinearLayout(this);navigation.setBackgroundColor(PAPER);navigation.setPadding(dp(12),dp(6),dp(12),dp(6));
        for(int i=0;i<2;i++){final int index=i;tabs[i]=button(i==0?"🛒 Gestão":"♡ Nossa loja",PAPER,PURPLE);tabs[i].setOnClickListener(v->navigate(index==0?NavigationPolicy.ENTRY:NavigationPolicy.ORIGIN+"/"));navigation.addView(tabs[i],new LinearLayout.LayoutParams(0,dp(48),1));}
        root.addView(navigation,new LinearLayout.LayoutParams(-1,dp(60)));
        if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::goBack);
        String deepLink=getIntent().getDataString();
        if(NavigationPolicy.isInternal(deepLink))navigate(deepLink);else if(state==null||web.restoreState(state)==null)navigate(NavigationPolicy.ENTRY);
        root.requestApplyInsets();
    }
    private void configureWebView() {
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);settings.setSupportMultipleWindows(true);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUserAgentString(settings.getUserAgentString()+" CarrinhoAndroid/1.0");
        CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);cookies.setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                if(!request.isForMainFrame())return !NavigationPolicy.isInternal(request.getUrl().toString());
                return handleNavigation(request.getUrl().toString());
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap favicon){if(NavigationPolicy.isInternal(url))lastUrl=url;failed=false;error.setVisibility(View.GONE);progress.setVisibility(View.VISIBLE);updateNavigation(url);}
            @Override public void onPageCommitVisible(WebView view,String url){if(!failed)splash.setVisibility(View.GONE);}
            @Override public void onPageFinished(WebView view,String url){if(!failed){splash.setVisibility(View.GONE);error.setVisibility(View.GONE);}progress.setVisibility(View.GONE);CookieManager.getInstance().flush();updateNavigation(url);}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError issue){if(request.isForMainFrame())showError("Confira sua conexão para acessar a gestão.");}
            @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,WebResourceResponse response){if(request.isForMainFrame()&&response.getStatusCode()>=400)showError(response.getStatusCode()==404?"A gestão ainda não está disponível neste endereço. Tente novamente depois da ativação.":"A gestão está temporariamente indisponível. Tente novamente em instantes.");}
            @Override public void onReceivedSslError(WebView view,android.webkit.SslErrorHandler handler,android.net.http.SslError issue){handler.cancel();showError("Não foi possível conectar com segurança. Confira a data do celular e tente novamente.");}
            @Override public boolean onRenderProcessGone(WebView view,android.webkit.RenderProcessGoneDetail detail){((ViewGroup)view.getParent()).removeView(view);view.destroy();web=null;recreate();return true;}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView view,int value){progress.setProgress(value);}
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(!NavigationPolicy.isInternal(view.getUrl()))return false;
                if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);pick.addCategory(Intent.CATEGORY_OPENABLE);pick.setType("image/*");pick.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/jpeg","image/png","image/webp"});pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);
                try{startActivityForResult(pick,PICK_IMAGES);}catch(ActivityNotFoundException e){fileCallback.onReceiveValue(null);fileCallback=null;toast("Não foi possível abrir o seletor de fotos.");}return true;
            }
            @Override public void onPermissionRequest(android.webkit.PermissionRequest request){request.deny();}
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,Message result){
                if(!gesture)return false;
                WebView popup=new WebView(MainActivity.this);popup.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView ignored,WebResourceRequest request){handlePopup(request.getUrl().toString());popup.destroy();return true;}});
                ((WebView.WebViewTransport)result.obj).setWebView(popup);result.sendToTarget();return true;
            }
            @Override public boolean onJsAlert(WebView view,String url,String message,android.webkit.JsResult result){new AlertDialog.Builder(MainActivity.this).setTitle("Carrinho da Vitória").setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
            @Override public boolean onJsConfirm(WebView view,String url,String message,android.webkit.JsResult result){new AlertDialog.Builder(MainActivity.this).setTitle("Carrinho da Vitória").setMessage(message).setPositiveButton("Confirmar",(d,w)->result.confirm()).setNegativeButton("Cancelar",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
        });
        web.setDownloadListener((url,agent,disposition,mime,length)->saveCsv(url));
    }
    private boolean handleNavigation(String url){if(NavigationPolicy.isCsv(url)){saveCsv(url);return true;}if(!NavigationPolicy.isInternal(url)){openExternal(url);return true;}return false;}
    private void handlePopup(String url){if(NavigationPolicy.isInternal(url))navigate(url);else if(NavigationPolicy.isCsv(url))saveCsv(url);else openExternal(url);}
    private void navigate(String url){if(web==null||!NavigationPolicy.isInternal(url))return;failed=false;error.setVisibility(View.GONE);progress.setVisibility(View.VISIBLE);lastUrl=url;web.loadUrl(url);}
    private void openExternal(String url){if(!NavigationPolicy.canOpenExternal(url)){toast("Este endereço não pode ser aberto no aplicativo.");return;}try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(ActivityNotFoundException e){toast("Nenhum aplicativo disponível para abrir este link.");}}
    private void showError(String message){failed=true;splash.setVisibility(View.GONE);errorDescription.setText(message);error.setVisibility(View.VISIBLE);progress.setVisibility(View.GONE);}
    private void updateNavigation(String url){if(navigation==null||!NavigationPolicy.isInternal(url))return;int selected=Uri.parse(url).getPath().startsWith("/gestao")?0:1;for(int i=0;i<2;i++){tabs[i].setAlpha(i==selected?1:.55f);tabs[i].setSelected(i==selected);}}
    private void saveCsv(String url){
        if(web==null||!NavigationPolicy.isInternal(web.getUrl())||!NavigationPolicy.isCsv(url)||pendingCsv!=null){toast("Não foi possível salvar este arquivo.");return;}
        try{pendingCsv=Base64.decode(url.substring(NavigationPolicy.CSV_PREFIX.length()),Base64.DEFAULT);if(pendingCsv.length>3*1024*1024)throw new IllegalArgumentException();Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);save.addCategory(Intent.CATEGORY_OPENABLE);save.setType("text/csv");save.putExtra(Intent.EXTRA_TITLE,"Carrinho-cliques.csv");startActivityForResult(save,SAVE_CSV);}catch(Exception e){pendingCsv=null;toast("Não foi possível abrir o local de salvamento.");}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_IMAGES&&fileCallback!=null){
            ArrayList<Uri> selected=new ArrayList<>();
            if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null){int count=data.getClipData().getItemCount();if(count>5)toast("Você pode escolher até cinco fotos.");for(int i=0;i<Math.min(count,5);i++)addImage(selected,data.getClipData().getItemAt(i).getUri());}else addImage(selected,data.getData());}
            fileCallback.onReceiveValue(selected.isEmpty()?null:selected.toArray(new Uri[0]));fileCallback=null;
        }
        if(request==SAVE_CSV){byte[] bytes=pendingCsv;pendingCsv=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri destination=data.getData();new Thread(()->{try(OutputStream output=getContentResolver().openOutputStream(destination,"w")){if(output==null)throw new java.io.IOException();output.write(bytes);runOnUiThread(()->toast("Relatório de cliques salvo."));}catch(Exception e){runOnUiThread(()->toast("Não foi possível salvar o relatório."));}},"carrinho-export").start();}}
    }
    private void addImage(ArrayList<Uri> images,Uri uri){if(uri==null||!"content".equals(uri.getScheme()))return;try{String mime=getContentResolver().getType(uri);if("image/jpeg".equals(mime)||"image/png".equals(mime)||"image/webp".equals(mime))images.add(uri);else toast("Escolha uma imagem JPG, PNG ou WebP.");}catch(Exception e){toast("Não foi possível abrir esta foto.");}}
    private LinearLayout brand(boolean dark){LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);panel.setGravity(Gravity.CENTER);panel.setPadding(dp(28),dp(25),dp(28),dp(25));panel.setBackgroundColor(dark?PURPLE:PAPER);ImageView image=new ImageView(this);image.setImageResource(R.drawable.vitoria);image.setContentDescription("Vitória, personagem oficial da marca");image.setScaleType(ImageView.ScaleType.FIT_CENTER);panel.addView(image,new LinearLayout.LayoutParams(dp(200),dp(200)));TextView name=text("Carrinho da Vitória",27,dark?YELLOW:PURPLE);name.setTypeface(Typeface.create("sans-serif-rounded",Typeface.BOLD));panel.addView(name);return panel;}
    private TextView text(String value,int size,int color){TextView view=new TextView(this);view.setText(value);view.setTextSize(size);view.setTextColor(color);view.setGravity(Gravity.CENTER);return view;}
    private Button button(String label,int bg,int fg){Button button=new Button(this);button.setText(label);button.setTextSize(14);button.setTextColor(fg);button.setAllCaps(false);GradientDrawable shape=new GradientDrawable();shape.setColor(bg);shape.setCornerRadius(dp(22));button.setBackground(shape);return button;}
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private void toast(String message){if(!isFinishing())Toast.makeText(this,message,Toast.LENGTH_LONG).show();}
    private void goBack(){if(web!=null&&web.canGoBack())web.goBack();else finish();}
    @Override public void onBackPressed(){goBack();}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(NavigationPolicy.isInternal(intent.getDataString()))navigate(intent.getDataString());}
    @Override protected void onSaveInstanceState(Bundle state){if(web!=null)web.saveState(state);super.onSaveInstanceState(state);}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onPause(){if(web!=null)web.onPause();CookieManager.getInstance().flush();super.onPause();}
    @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);if(web!=null){((ViewGroup)web.getParent()).removeView(web);web.destroy();web=null;}super.onDestroy();}
}
