package com.carrinhodavitoria.gestao;

import java.net.URI;

/** Navigation only: every permission and session is enforced by the server. */
public final class NavigationPolicy {
    public static final String ORIGIN = "https://carrinhodavitoria.setyourday.com.br";
    public static final String ENTRY = ORIGIN + "/gestao";
    public static final String CSV_PREFIX = "data:text/csv;charset=utf-8;base64,";
    public static boolean isInternal(String value) {
        try {
            URI uri = new URI(value);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme()) && host != null
                && (host.equalsIgnoreCase("carrinhodavitoria.setyourday.com.br") || host.equalsIgnoreCase("carrinho-da-vitoria.vercel.app"))
                && uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443);
        } catch (Exception e) { return false; }
    }
    public static boolean canOpenExternal(String value) {
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443);
        } catch (Exception e) { return false; }
    }
    public static boolean isCsv(String value) {
        return value != null && value.startsWith(CSV_PREFIX) && value.length() <= 4 * 1024 * 1024;
    }
    private NavigationPolicy() {}
}
