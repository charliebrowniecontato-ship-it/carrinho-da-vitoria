import com.carrinhodavitoria.gestao.NavigationPolicy;

public class NavigationPolicyTest {
    public static void main(String[] args) {
        yes(NavigationPolicy.isInternal(NavigationPolicy.ENTRY));
        yes(NavigationPolicy.isInternal("https://carrinho-da-vitoria.vercel.app/gestao#ativar=exemplo"));
        no(NavigationPolicy.isInternal("https://carrinhodavitoria.setyourday.com.br.evil.test/gestao"));
        no(NavigationPolicy.isInternal("https://senha@carrinhodavitoria.setyourday.com.br/gestao"));
        no(NavigationPolicy.isInternal("http://carrinhodavitoria.setyourday.com.br/gestao"));
        no(NavigationPolicy.isInternal("https://carrinhodavitoria.setyourday.com.br:444/gestao"));
        no(NavigationPolicy.isInternal(null));
        yes(NavigationPolicy.canOpenExternal("https://shopee.com.br/produto"));
        no(NavigationPolicy.canOpenExternal("javascript:alert(1)"));
        no(NavigationPolicy.canOpenExternal("intent://local"));
        no(NavigationPolicy.canOpenExternal("file:///data/privado"));
        yes(NavigationPolicy.isCsv(NavigationPolicy.CSV_PREFIX+"YWJj"));
        no(NavigationPolicy.isCsv("data:text/html;base64,YWJj"));
        no(NavigationPolicy.isCsv(NavigationPolicy.CSV_PREFIX+new String(new char[4*1024*1024])));
        System.out.println("Navigation and CSV boundaries passed");
    }
    static void yes(boolean value){if(!value)throw new AssertionError("Expected true");}
    static void no(boolean value){if(value)throw new AssertionError("Expected false");}
}
