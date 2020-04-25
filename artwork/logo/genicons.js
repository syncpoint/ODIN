#!/usr/bin/env node

'use strict'

const icongen = require('icon-gen')

const fs = require('fs')


const options = {
    report: true,
    ico: {
      name: 'icon',
      sizes: [16, 24, 32, 48, 64, 128, 256]
    },
    icns: {
      name: 'icon',
      sizes: [16, 32, 64, 128, 256, 512, 1024]
    },
    favicon: {
      name: '',
      pngSizes: [16,32,57,64,72,114,128,152,167,180,192,196,256,512,1024],
      icoSizes: [16, 24, 32, 48, 64]
    }
  }


const dest="icons"
const iconFile="logo.svg"

if (!fs.existsSync(dest)) fs.mkdirSync(dest); 

icongen(iconFile, dest, options)
  .then((results) => {
    console.log(results)
  })
  .catch((err) => {
    console.error(err)
  })