# Carrinho Gestão Android 1.0.1

APK universal para Android 8.0 ou superior, pacote `com.carrinhodavitoria.gestao`.
Abre `https://carrinhodavitoria.setyourday.com.br/gestao`; a aba Nossa loja abre a vitrine no mesmo domínio.
O login e todas as permissões usam o servidor da gestão. O APK não contém senha, chave de banco ou token do bot.

## Recursos

Ícone oficial do carrinho e abertura com a personagem Vitória, cores roxo e amarelo, navegação inferior, links de afiliado no navegador externo, escolha de até cinco fotos JPG/PNG/WebP pelo seletor do Android e salvamento de CSV pelo seletor de documentos.
Somente a permissão Internet é necessária. A sessão usa cookies privados do aplicativo. Acesso e publicação exigem internet.

## Compilação

Java 17, Android SDK platform 35 e Build Tools 35.0.0. A assinatura fica fora do repositório.

```sh
python3 android/build.py --sdk-root /caminho/android-sdk \
  --keystore /caminho/privado/carrinho-release.p12 \
  --password-file /caminho/privado/signing-password.txt \
  --output /caminho/Carrinho-da-Vitoria-Gestao-1.0.1.apk
```

Preserve a mesma chave (alias `carrinho`) e incremente versionCode/versionName para atualizações.
O script valida a assinatura v2/v3 e o alinhamento do APK com ferramentas oficiais Android.
O teste NavigationPolicyTest verifica os domínios permitidos, links externos e limites do CSV.

## Estado de entrega

APK compilado, assinatura e alinhamento verificados. O painel `/gestao` foi publicado e responde com HTTP 200. O titular deve criar sua senha no link de ativação antes do primeiro login. Ainda não houve teste instalado em um celular físico.
