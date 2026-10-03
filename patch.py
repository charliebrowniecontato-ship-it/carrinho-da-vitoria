from pathlib import Path
p=Path(r"C:\Users\puaet\carrinho-update\index.html")
s=p.read_text(encoding="utf-8")
product="""{id:'mouse-rgb-kw201',title:'Mouse Sem Fio Recarregável RGB KW201',subtitle:'Clique silencioso, bateria recarregável e 3 níveis de DPI',category:'tecnologia',categoryLabel:'Tecnologia',store:'Shopee',price:17.29,maxPrice:19.69,oldPrice:17.59,discount:2,rating:'4,9',reviews:'32,4 mil avaliações · 50 mil+ vendidos',image:'https://down-br.img.susercontent.com/file/sg-11134201-8259h-mfv94kn6czd995',link:'https://s.shopee.com.br/7ptfH7yTpD',badge:'Achado tech',featured:true,features:['Sem fio 2.4 GHz com mini receptor USB','Bateria interna recarregável','Até 30 dias de bateria segundo o anúncio','Recarga em cerca de 2 horas','3 níveis de DPI: 800, 1200 e 1600','Clique silencioso e iluminação RGB gradual'],note:'Modelo KW201. Preço, cor, estoque, frete e condições são confirmados diretamente na Shopee.'},"""
if "id:'mouse-rgb-kw201'" not in s:
    s=s.replace("const PRODUCTS=[\n","const PRODUCTS=[\n"+product+"\n",1)
spec="""'mouse-rgb-kw201':[['Tipo de conexão','Sem fio 2.4 GHz'],['Modelo','KW201'],['Botões','4'],['Alcance','Até 10 metros'],['Resolução','800 / 1200 / 1600 DPI'],['Peso','Aprox. 70 g'],['Recarga','Micro USB · cerca de 2 horas'],['Bateria','Interna recarregável · até 30 dias segundo o anúncio'],['Compatibilidade','Windows XP / Vista / 7 / 8 / 10 / 11'],['Envio','São Paulo']],\n"""
if "'mouse-rgb-kw201':" not in s and "const PRODUCT_SPECS={" in s:
    s=s.replace("const PRODUCT_SPECS={\n","const PRODUCT_SPECS={\n"+spec,1)
s=s.replace('<script>setTimeout(function(){fetch("/api/sync-latest",{method:"POST",keepalive:true}).catch(function(){});},1200);</script>','')
p.write_text(s,encoding="utf-8")
print("patched", "mouse-rgb-kw201" in s)
