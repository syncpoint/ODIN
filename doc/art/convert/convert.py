#!/usr/bin/env python3


"""

OSX

# create icon.iconset folder
mkdir icon.iconset
# resize all the images
sips -z 16 16     icon.iconset/icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.iconset/icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.iconset/icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.iconset/icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.iconset/icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.iconset/icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.iconset/icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.iconset/icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.iconset/icon.png --out icon.iconset/icon_512x512.png
cp icon.iconset/icon.png icon.iconset/icon_512x512@2x.png
# remove the base image
rm -rf icon.iconset/icon.png
# create the .icns
iconutil -c icns icon.iconset
# remove the temp folder
rm -R icon.iconset

LINUX (deb)

apt install icnsutils

Usage: png2icns file.icns file1.png file2.png ... filen.png

"""

import argparse
from PIL import Image
from pathlib import Path
import shutil, subprocess,sys
import glob      


parser = argparse.ArgumentParser(description='Convert images to icons!')
parser.add_argument("--directory", "-d", help='output location')
parser.add_argument("--name", "-n", help='icon name')
parser.add_argument('filename')

args = parser.parse_args()

print("Running on ",sys.platform)

if args.directory:
    print(args.directory)

mainicon =  Path(args.filename).resolve()
output = (Path(args.directory).resolve() if args.directory else Path('.').resolve()).joinpath("icons")
iconname = args.name if args.name else 'icon'

def convertImage(iname,oname, width,height):
     icon = Image.open(iname)
     newicon = icon.resize((width,height))
     newicon.save(oname)
   
def createIcns(outputname, srcpath):
    if sys.platform == 'darwin':
          subprocess.run(["iconutil", "-c","icns","--output",outputname, srcpath])
    elif sys.platform == 'linux':
          files = glob.glob(srcpath.joinpath("*.png").as_posix())
          subprocess.run(["png2icns", outputname] + files)


def createAppleIcons():
    print("Creating icons using os dependent tool")
    osx_output = output.joinpath("mac")
    # remove old content
    shutil.rmtree(osx_output, ignore_errors=True)

    iconset = osx_output.joinpath('icon.iconset')
    iconset.mkdir(parents=True)
    convertImage(mainicon, iconset.joinpath('icon_16x16.png'),16,16)
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_16x16@2x.png'),32,32)
    
    convertImage(mainicon, iconset.joinpath('icon_32x32.png'),32,32)
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_32x32@2x.png'),64,64)
        convertImage(mainicon, iconset.joinpath('icon_64x64.png'),64,64)
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_64x64@2x.png'),128,128)
    convertImage(mainicon, iconset.joinpath('icon_128x128.png'),128,128)
    
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_128x128@2x.png'),256,256)
    convertImage(mainicon, iconset.joinpath('icon_256x256.png'),256,256)
    
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_256x256@2x.png'),512,512)
    convertImage(mainicon, iconset.joinpath('icon_512x512.png'),512,512)
    
    if sys.platform == 'darwin':
        convertImage(mainicon, iconset.joinpath('icon_512x512@2x.png'),1024,1024)
    convertImage(mainicon, iconset.joinpath('icon_1024x1024.png'),1024,1024)
    # create icon
    createIcns(osx_output.joinpath(iconname + '.icns'),iconset)
    # remove folder
    shutil.rmtree(iconset, ignore_errors=True)

def createAppleIconsPIL():
    print("Creating icons using PIL")
    osx_output = output.joinpath("mac")
    shutil.rmtree(osx_output, ignore_errors=True)
    osx_output.mkdir(parents=True)
    icon = Image.open(mainicon)
    icon_sizes = [(16,16,1),(16,16,2), (32, 32,1),(32, 32,2),(64,64,1),(64,64,2),(128,128,1),(128,128,2),(256,256,1),(256,256,2),(512,512,1),(512,512,2),(1024,1024,1)]
    icon.save(osx_output.joinpath(iconname + '.icns'), sizes=icon_sizes)


def createPngIcons():

    png_output = output.joinpath("png")
    # remove old content
    shutil.rmtree(png_output, ignore_errors=True)
    png_output.mkdir(parents=True)

    convertImage(mainicon, png_output.joinpath('16x16.png'),16,16)
    convertImage(mainicon, png_output.joinpath('32x32.png'),32,32)
    convertImage(mainicon, png_output.joinpath('57x57.png'),57,57)
    convertImage(mainicon, png_output.joinpath('64x64.png'),64,64)
    convertImage(mainicon, png_output.joinpath('72x72.png'),72,72)
    convertImage(mainicon, png_output.joinpath('114x114.png'),114,114)
    convertImage(mainicon, png_output.joinpath('128x128.png'),128,128)
    convertImage(mainicon, png_output.joinpath('152x152.png'),152,152)
    convertImage(mainicon, png_output.joinpath('167x167.png'),167,167)
    convertImage(mainicon, png_output.joinpath('180x180.png'),180,180)
    convertImage(mainicon, png_output.joinpath('192x192.png'),192,192)
    convertImage(mainicon, png_output.joinpath('196x196.png'),196,196)
    convertImage(mainicon, png_output.joinpath('256x256.png'),256,256)
    convertImage(mainicon, png_output.joinpath('512x512.png'),512,512)
    convertImage(mainicon, png_output.joinpath('1024x1024.png'),1024,1024)

def createWinIcon():
    win_output = output.joinpath("win")
    shutil.rmtree(win_output, ignore_errors=True)
    win_output.mkdir(parents=True)
    icon = Image.open(mainicon)
    icon_sizes = [(16,16), (32, 32), (48, 48), (64,64),(128,128),(256,256),(512,512),(1024,1024)]
    icon.save(win_output.joinpath(iconname + '.ico'), sizes=icon_sizes)

def createFavIcon():
    icon = Image.open(mainicon)
    icon_sizes = [(16,16),(32, 32), (48, 48)]
    icon.save(output.joinpath('favicon.ico'), sizes=icon_sizes)


def printHTML():
    print('<link rel="shortcut icon" type="image/vnd.microsoft.icon" href="/favicon.ico">')
    print('<link rel="icon" sizes="16x16 32x32 64x64" href="/favicon.ico">')
    print('<link rel="icon" type="image/png" sizes="196x196" href="/icons/png/196x196.png">')
    print('<link rel="icon" type="image/png" sizes="160x160" href="/icons/png/160x160.png">')
    print('<link rel="icon" type="image/png" sizes="96x96" href="/icons/png/114x114.png"> <!-- Opera Speed Dial, at least 144×114 px -->')
    print('<link rel="icon" type="image/png" sizes="96x96" href="/icons/png/96x96.png">')
    print('<link rel="icon" type="image/png" sizes="64x64" href="/icons/png/64x64.png">')
    print('<link rel="icon" type="image/png" sizes="32x32" href="/icons/png/32x32.png">')
    print('<link rel="icon" type="image/png" sizes="16x16" href="/icons/png/16x16.png">')
    print('<link rel="apple-touch-icon" href="/icons/png/57x57.png">')
    print('<link rel="apple-touch-icon" sizes="114x114" href="/icons/png/114x114.png">')
    print('<link rel="apple-touch-icon" sizes="72x72" href="/icons/png/72x72.png">')
    print('<link rel="apple-touch-icon" sizes="144x144" href="/icons/png/144x144.png">')
    print('<link rel="apple-touch-icon" sizes="60x60" href="/icons/png/60x60.png">')
    print('<link rel="apple-touch-icon" sizes="120x120" href="/icons/png/120x120.png">')
    print('<link rel="apple-touch-icon" sizes="76x76" href="/icons/png/76x76.png">')
    print('<link rel="apple-touch-icon" sizes="152x152" href="/icons/png/152x152.png">')
    print('<link rel="apple-touch-icon" sizes="180x180" href="/icons/png/180x180.png">')
    print('<link rel="apple-touch-icon" sizes="167x167" href="t/icons/png/167x167.png">')



if sys.platform == 'darwin':
    createAppleIconsPIL()
else:
    createAppleIcons()

createPngIcons()
createWinIcon()
createFavIcon()
printHTML()
