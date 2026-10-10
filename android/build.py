#!/usr/bin/env python3
"""Build a signed, universal APK using the official Android SDK (no npm/Gradle)."""
from pathlib import Path
import argparse, shutil, subprocess, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--sdk-root',required=True)
parser.add_argument('--build-tools')
parser.add_argument('--keystore',required=True)
parser.add_argument('--password-file',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parent
sdk=Path(args.sdk_root).resolve()
tools=Path(args.build_tools).resolve() if args.build_tools else sdk/'build-tools'/'35.0.0'
platform=sdk/'platforms'/'android-35'/'android.jar'
work=root/'build'
if work.exists(): shutil.rmtree(work)
for folder in ['compiled','generated','classes','dex']: (work/folder).mkdir(parents=True)

def run(*command): subprocess.run([str(value) for value in command],check=True)

run(tools/'aapt2','compile','--dir',root/'app/src/main/res','-o',work/'resources.zip')
run(tools/'aapt2','link','-o',work/'unsigned.apk','-I',platform,'--manifest',root/'app/src/main/AndroidManifest.xml','--java',work/'generated','--min-sdk-version','26','--target-sdk-version','35',work/'resources.zip')
sources=list((root/'app/src/main/java').rglob('*.java'))+list((work/'generated').rglob('*.java'))
run('java','com.sun.tools.javac.Main','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',str(tools/'core-lambda-stubs.jar')+':'+str(platform),'-d',work/'classes',*sources)
with zipfile.ZipFile(work/'classes.jar','w',compression=zipfile.ZIP_DEFLATED) as archive:
    for source in (work/'classes').rglob('*.class'): archive.write(source,source.relative_to(work/'classes').as_posix())
run('java','-cp',tools/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',platform,'--output',work/'dex',work/'classes.jar')
with zipfile.ZipFile(work/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as archive:
    for source in (work/'dex').glob('*.dex'): archive.write(source,source.name)
run(tools/'zipalign','-P','16','-f','4',work/'unsigned.apk',work/'aligned.apk')
output=Path(args.output).resolve(); output.parent.mkdir(parents=True,exist_ok=True)
run('java','-jar',tools/'lib/apksigner.jar','sign','--ks',Path(args.keystore).resolve(),'--ks-key-alias','carrinho','--ks-pass','file:'+str(Path(args.password_file).resolve()),'--v1-signing-enabled','false','--v2-signing-enabled','true','--v3-signing-enabled','true','--v4-signing-enabled','false','--out',output,work/'aligned.apk')
run('java','-jar',tools/'lib/apksigner.jar','verify','--verbose',output)
run(tools/'zipalign','-c','-P','16','4',output)
print('Signed APK:',output)
