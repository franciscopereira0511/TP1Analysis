/**
 * Filename: wav-test.ts
 * Author: rnunez
 * Date: 04/10/2019
 * Description: testing wav encoder
 */


import * as fs from 'fs';
// import { complex as fft } from 'fft';
import * as WavEncoder from 'wav-encoder';
// import { default as ft } from 'fourier-transform';
import * as WavDecoder from 'wav-decoder';

const readFile = (filepath: string) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });
};



//Para hallar el valor máximo y mínimo del array de puntos
function findMinMax(array:number[]) {
  let min = array[0], max = array[0];


  for (let i = 1; i < array.length; i++) {
    let v = array[i];
    min = (v < min) ? v : min;
    max = (v > max) ? v : max;
  }
  return [min, max];
}



//Para hallar la cantidad de picos por segundo, siendo picos los puntos que están por encima del 60% del valor máximo y mínimo
function getPeaks(array:number[]){

  let positivePeakCondition:number = findMinMax(array)[1]*0.60;
  let negativePeakCondition:number = findMinMax(array)[0]*0.60;
  let result:any[][] = [];
  let peakCounter:number = 0;
  let firstPeak:number = 0;

  //Recorre los puntos del array para hallar picos
  for(let i=0;i<array.length;i++){
    //Divide los picos por segundo
    for(let j=0;j<44100;j++){
      if(j==0){
        firstPeak = i;
      }
      if(array[i]<negativePeakCondition || array[i]>positivePeakCondition){
        peakCounter += 1;
      }
      i++;
    }
    //Cada 44100 elementos (1 segundo) hace un push en el resultado para incluir la cantidad de picos en ese segundo
    result.push([peakCounter,firstPeak]);
    peakCounter=0;
    firstPeak=0;
  }
  return result;
}



function secondWithMostPeaks(peaks:number[][]){
  var result:number = 0;
  for(var i=0;i<peaks.length;i++){
    if(peaks[i][0]>result){
      result=peaks[i][0];
    }
  }
  return result;
}

function statisticsTable(peaks:number[][],rowRange:number){

  var mostPeaks = secondWithMostPeaks(peaks)
  var rows:number = Math.floor(mostPeaks/rowRange)
  var result:any[][] = Array(rows+1).fill(null).map(()=>([]));
  var resultIndex = 0;

  for(var i=0; i<peaks.length; i++){
    for(let minCondition=0; minCondition<mostPeaks; minCondition+=rowRange){
      if(minCondition <= peaks[i][0] && peaks[i][0] <= minCondition+rowRange){
        result[resultIndex].push(peaks[i]);
        break;
      }
      else{
        resultIndex+=1;
      }
    }
    resultIndex=0;
  }
  return result;
}

function match(s1StatisticsTable:any[][],S2Peaks:any[][],errorMargin:number,iterations:number){
  var S2start:number[] = S2Peaks[0];
  var S2end:number[] = S2Peaks[S2Peaks.length-1];
  var matchDistance:number = Math.abs(S2end[1]-S2start[1]); //Distancia entre el inicio y el final del sample
  var result:number[][] = [];
  
  //Obtengo valores aproximados al inicio de S2 de la tabla estadistica de S1
  var startlikelyMatches:number[][];
  if(S2start[0]<100){
    startlikelyMatches=s1StatisticsTable[0];
  }
  else{
    startlikelyMatches=s1StatisticsTable[Math.trunc(S2start[0]/100)];
  }

  //Obtengo valores aproximados al final de S2 de la tabla estadistica de S1
  var endlikelyMatches:number[][];
  if(S2end[0]<100){
    endlikelyMatches=s1StatisticsTable[0];
  }
  else{
    endlikelyMatches=s1StatisticsTable[Math.trunc(S2end[0]/100)];
  }
  console.log("Segundo inicial S2: ",S2start);
  console.log("Posibles matches segundo inicial S1: ",startlikelyMatches);
  console.log("Segundo final S2: ",S2end);
  console.log("Posibles matches segundo final S1: ",endlikelyMatches);
  console.log("Maximas iteraciones posibles: ", startlikelyMatches.length*endlikelyMatches.length);

  var randomStart:number = 0;
  var randomEnd:number = 0;
  var endlikelyMatchesSave:number[][] = endlikelyMatches; //Guardo los posibles finales S1
  var matchDistanceAspirant:number = 0; //Distancia entre punto 1 y punto 2 del posible match

  //Ejecuto cantidad de iteraciones de MonteCarlo segun se ingresó
  for(var k=0;k<startlikelyMatches.length; k++){
    randomStart = Math.floor(Math.random() * Math.floor(startlikelyMatches.length)); //Agarra un valor random de posibles inicios de S1

    for(var j=0; j<endlikelyMatches.length; j++){
      randomEnd = Math.floor(Math.random() * Math.floor(endlikelyMatches.length));  //Agarra un indice random de los posibles finales S1
      matchDistanceAspirant = Math.abs(endlikelyMatches[randomEnd][1]-startlikelyMatches[randomStart][1]);  //Posible distancia entre puntos de s1 que haría match
 
      //Si la distancia del posible inicio y posible final de S1 calza con los de S1, hay match
      console.log(matchDistanceAspirant-errorMargin, "<=", matchDistance, "<=", matchDistanceAspirant+errorMargin)
      if(matchDistanceAspirant-errorMargin <= matchDistance && matchDistance <= matchDistanceAspirant+errorMargin){
        result.push([endlikelyMatches[randomStart][1],endlikelyMatches[randomEnd][1]]) //Guarda el indice de inicio e indice de final de S1 que hizo match
      }

      iterations--; //Reduce iteraciones
      console.log(result);
      if(iterations==0) return result; //Si se acaban las iteraciones, deja de hacer comparaciones y retorna el resultado
      endlikelyMatches.splice(randomEnd,1); //Quita el valor de los posibles inicios de S2 en S1
    }
    startlikelyMatches.splice(randomStart,1); //Quita el valor de los posibles inicios de S2 en S1
    endlikelyMatches=endlikelyMatchesSave; //Recupera los posibles finales de S1 para probar con otro posible inicio
  }
}



function generarRelieves(s1:number[]){
  var shapeLen:number = 0;
  var result:any[][] = [];
  var resultTemp:number[] = [];
  for(let i=0; i<s1.length; i++){
    resultTemp.push(s1[i]);

    //Si pasa de positivo a negativo, se terminó la forma
    if(Math.sign(s1[i])==1 && Math.sign(s1[i+1])==-1 && resultTemp.length>100){
      //Aqui debo llamar a la funcion que identifica la forma de resultTemp
      result.push([resultTemp[0],"Forma",resultTemp.length]);
    }
    //Si pasa de negativo a positivo, inicia la forma
    if(Math.sign(s1[i])==-1 && Math.sign(s1[i+1])==1){
      resultTemp=[];
      resultTemp.push(i);
    }
  }
  console.log(result);
  return result;
}


readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\s1.wav").then((buffer) => {
  return WavDecoder.decode(buffer);
}).then(function(audioDataS1) {
  console.log("ampliando 30%");
  const size = 20000;

  for(var i=44100*5; i<44100*10; i++) {
    audioDataS1.channelData[0][i-44100*5] = audioDataS1.channelData[0][i];
  }

  for(var i=44100*11; i<44100*16; i++) {
    audioDataS1.channelData[0][i+44100*6] = audioDataS1.channelData[0][i];
  }

  function generateWAV(leftChannel:number[],rightChannel:number[]){
    audioDataS1.channelData[0] = new Float32Array(leftChannel);
    audioDataS1.channelData[1] = new Float32Array(rightChannel);
    console.log("writing...");
    WavEncoder.encode(audioDataS1).then((buffer: any) => {
      fs.writeFileSync("./Sound/WaV.wav", new Buffer(buffer));
    });
  }

  readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\s2.wav").then((buffer) => {
    return WavDecoder.decode(buffer);
  }).then(function(audioDataS2) {
    //console.log("ampliando 30%");
    const size = 20000;
  
    for(var i=44100*5; i<44100*10; i++) {
      audioDataS2.channelData[0][i-44100*5] = audioDataS2.channelData[0][i];
    }
  
    for(var i=44100*11; i<44100*16; i++) {
      audioDataS2.channelData[0][i+44100*6] = audioDataS2.channelData[0][i];
    }

    


  let valuesS1 = audioDataS1.channelData[0];
  let peaksS1 = getPeaks(valuesS1);

  let valuesS2 = audioDataS2.channelData[0];
  let peaksS2 = getPeaks(valuesS2);
  
  var s2Test = [20,305,424,1354];
  var s1Test = [1,2,3,4,5,-6,7,8,9,10,11,12,-13,14,15];

  var s1table = statisticsTable(peaksS1,100);
  //console.log(s1table);
  console.log(peaksS2);
  //console.log(match(s1table,peaksS2,88200,16));
  

  //generateWAV(audioDataS1.channelData[0],audioDataS1.channelData[1])

});
});