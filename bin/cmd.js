import { Command } from "commander"
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import fs from "fs";

const { mkdirSync, writeFileSync, readFileSync } = fs//require('fs')

const pathModel = "D:/RCShort/RCDom/bin"
let version = "0.1.0"
function read(name) {
  return readFileSync(pathModel + "/dist/" + name, { encoding: "utf-8" })
}
function readFile(name) {
  return readFileSync(pathModel + "/" + name, { encoding: "utf-8" })
}

const pckgJSON={
  "name": "rc-dom",
  "version": "1.0.0",
  "main": "index.js",
  "description": "",
  "devDependencies": {
    "@babel/core": "^7.18.9",
    "@babel/plugin-transform-react-jsx": "^7.18.6",
    "parcel": "^2.4.1"
  },
  "scripts": {
    "start":"parcel index.html"
  }
}
async function ask(question,defaultReponse=""){
  const Q=await inquirer.prompt({
    name: "value",
    type: "input",
    message: question,
    default: () => defaultReponse
  })
  return Q.value
}
async function askConfirm(question,defaultReponse=""){
  const Q=await inquirer.prompt({
    name: "value",
    type: "confirm",
    message: question,
    default: () => defaultReponse
  })
  return Q.value
}
async function askChoose(message="choisissez:",choices=[]) {
  const res=await inquirer.prompt({
    name: "value",
    type: "list",
    message,
    choices,
  })
  return res.value
}

const htmlEs = readFile("model/index.es.html")
const scriptJSX = readFile("model/index.jsx")
const scriptES = readFile("model/script.js")
const babelConfigJson = readFile("model/babel.config.json")
const program = new Command();
const Rimax={
  esModule:read("rimax.es.js"),
  esModuleMap:read("rimax.es.js.map"),

  esModuleMin:read("rimax.es.min.js"),
  esModuleMinMap:read("rimax.es.min.js.map"),

  global:read("rimax.global.js"),
  globalMap:read("rimax.global.js.map"),

  globalMin:read("rimax.global.min.js"),
  globalMinMap:read("rimax.global.min.js.map"),

  esModuleDTS:read("rimax.es.d.ts"),

  globalDTS:read("rimax.global.d.ts"),
}

const CHOOSETYPE = {
  "var-global": true,
  "var-global-min": true,
  "es-module": true,
  "es-module-min": true,
}
const COMPOSANT = "composant"
const LIBRAIRIE = "librairie"
const PROJET = "projet"
const DEMO = "demo"
const PROJECTMODEL = {
  choose: {
    [LIBRAIRIE]: {
      type: CHOOSETYPE,
    },
    [PROJET]: {
      type: CHOOSETYPE,
      useJSX: false,
    },
    [DEMO]: {
      exemple: {
        "todo": ""
      },
    },
    [COMPOSANT]: {

    },
  }
}
function createRimaxLib(type,path=""){
  return({
    "var-global":async ()=>{
      createFile(path, "rimax.global.js",Rimax.global)
      createFile(path, "rimax.global.js.map",Rimax.globalMap)
      createFile(path, "rimax.global.d.ts",Rimax.globalDTS)
    },
    "var-global-min":async ()=>{
      createFile(path, "rimax.global.min.js",Rimax.globalMin)
      createFile(path, "rimax.global.min.js.map",Rimax.globalMinMap)
      createFile(path, "rimax.global.min.d.ts",Rimax.globalDTS)
    },
    "es-module":async ()=>{
      createFile(path, "rimax.es.js",Rimax.esModule)
      createFile(path, "rimax.es.js.map",Rimax.esModuleMap)
      createFile(path, "rimax.es.d.ts",Rimax.esModuleDTS)
    },
    "es-module-min":async ()=>{
      createFile(path, "rimax.es.min.js",Rimax.esModuleMin)
      createFile(path, "rimax.es.min.js.map",Rimax.esModuleMinMap)
      createFile(path, "rimax.es.min.d.ts",Rimax.esModuleDTS)
    }
  })[type]()
}
async function handlerProjet(choose,path="") {
  console.log("-->", choose);
  return ({
    [LIBRAIRIE]: async () => {
      const reponse = await askChoose("option de project:",Object.keys(PROJECTMODEL.choose.librairie.type)) 
      createRimaxLib(reponse,path)
    },
    [PROJET]: async () => {
      const id=(new Date).getTime()
      const nomProjet = await ask("Nom du projet ?","rimax-project-"+id)
      const descProjet = await ask("description ?","")
      const useJSX = await askConfirm("use jsx ?",false)
      if(useJSX){
        createFile(nomProjet, "script.js",scriptJSX)
        createFile(nomProjet, "babel.config.json",babelConfigJson)
      }else{
        pckgJSON.devDependencies="{}"
        createFile(nomProjet, "script.js",scriptES)
      }
      const path=nomProjet+"/dist"
      createRimaxLib("es-module-min",path)
      pckgJSON.name=nomProjet
      pckgJSON.description=descProjet
      createFile(nomProjet, "package.json",JSON.stringify(pckgJSON,null,2))
      createFile(nomProjet, "index.html",htmlEs)
    },
    [DEMO]: async () => {
      console.log("hello" + choose,"fonctionnaliter pas encore disponible");
    },
    [COMPOSANT]: async () => {
      console.log("hello" + choose,"fonctionnaliter pas encore disponible");
    },
  })[choose]()
}
//+++++++++++++++++++++++++++++++++
console.log('Rimax CLI:');
let chooseValue = "composant"
async function main() {
  const reponse = await inquirer.prompt({
    name: "question1",
    type: "list",
    message: "option de project:",
    choices: Object.keys(PROJECTMODEL.choose)
  })
  chooseValue = reponse.question1
  return reponse.question1
}

await handlerProjet(await main())



//----------------------------------
program
  .name('rcdom-cli')
  .description('CLI to some JavaScript string utilities')
  .version('0.8.0');

function createFile(path, fileName, contente) {
  if(path)mkdirSync(path, { recursive: true});
  writeFileSync("./" + path + "/" + fileName, contente)
}
program.command("new")
  .arguments("project name <string>")
  .option("--jsx", "utiliser jsx ?", false)
  .option("-m|--module", "utiliser rcdom en tant que module ?", false)
  .action((str, option) => {
    mkdirSync(str, { recursive: true })
    console.log(option);
    if (option.module) {
      createFile(str, "index.html", htmlEs)
      createFile(str, "rcdom.es.js", rcdomEs)
      if (option.jsx) {
        createFile(str, "babel.config.json", babelConfigJson)
        createFile(str, "package.json", packageJson)
        createFile(str, "index.js", scriptJSX)
      } else {
        createFile(str, "index.js", esJs)
      }
    } else {
      createFile(str, "index.html", htmlGlobal)
      createFile(str, "rcdom.iife.js", rimaxGlobal)
      createFile(str, "script.js", scriptES)
    }
  })



// program.parse();



const spinner = createSpinner('Run test').start()

setTimeout(() => {
  spinner.success({ text: 'Successful!', mark: ':)' })
}, 1000)