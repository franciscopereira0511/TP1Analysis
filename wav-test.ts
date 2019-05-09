/**
 * Filename: wav-test.ts
 * Author: rnunez
 * Date: 04/10/2019
 * Description: testing wav encoder
 */


//Dónde usar probabilidad
//Usarlo para saber cuáles serán los puntos a comparar
//Usarlo para saber cuál es la distribución de picos
//Para saber secciones aproximadas
//Paraa saber distribución de las formas que hayan

//Qué puedo hacer con la información de los picos
//Sacarle moods
//Reducir con aproximaciones, por ejemplo no buscar 16%, sino entre 10-20
//Encontrar un segundo que haga match con un segundo de S1
//Fijar un porcentaje de aceptación al comparar. Definir si es 80% igual. 

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

function secondWithMostPeaks(peaks:number[][]){
  var result:number = 0;
  for(var i=0;i<peaks.length;i++){
    if(peaks[i][0]>result){
      result=peaks[i][0];
    }
  }
  return result;
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


function statisticsTable(peaks:any[][],rows:number){
  var result = Array(rows+1).fill([]);
  var mostPeaks = secondWithMostPeaks(peaks)
  var rowRange = Math.floor(mostPeaks/rows);
  console.log(rowRange);
  var resultIndex = 0;

  //Recorre cada segundo de la lista de picos. En cada if se le suma a la fila de la tabla (dependiendo de la cantidad de picos del segundo) 
  //En indice 0: la cantidad de picos, Indice 1: se agregan los indices de los picos que estaban en el segundo
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
    console.log(result[0].length,result[1].length,result[2].length,result[3].length,result[4].length,result[5].length);
    console.log("#####################");
    resultIndex=0;
  }

  //console.log(result[0]);
  //console.log(result[1]);
  //console.log(result[2]);
  //console.log(result[3]);
  console.log(result[4]);
  //console.log(result[5]);

}

//Estadistica: Reducir las comparaciones a hacer para buscar match haciendo que 
//solo se guarden las varianzas de S1 del tamaño del sample en que la cantidad de picos es +-500 que el sample 
function prepareComparison(s1Peaks:number[],s2Peaks:number[]){
  var result:number[][] = [];
  var resultTemp:number[] = [];
  var sumS2:number = s2Peaks.reduce((a, b) => a + b, 0);
  var sumS1:number = 0;

  for(var i=0;i<s1Peaks.length-s2Peaks.length+1;i++){
    for(var j=0;j<s2Peaks.length;j++){
      //Guarda el índice de inicio de S1 para en caso que haga match
      if(j==0){
        resultTemp.push(i);
      }
      resultTemp.push(s1Peaks[i]);
      i++;
    }
    i-=s2Peaks.length;
    sumS1 = resultTemp.reduce((a, b) => a + b, 0);
    sumS1 -= resultTemp[0]; 

    //Si la cantidad de picos del pedacito de S1 del tamaño de s2 es +-500 con respecto a la de s2, se agrega al resultado final
    if(sumS1-500 <= sumS2 && sumS2 <= sumS1+500){
      result.push(resultTemp);
      resultTemp = [];
    }
    else{
      resultTemp = [];
    }

  }
  return result;
}

function match(s1LikelyMatches:number[][],s2Peaks:number[],errorMargin:number){
  var result:number[][] = [];
  for(var i=0; i<s1LikelyMatches.length;i++){
    for(var j=1;j<s2Peaks.length;j++){
      //Probabilidad: Compara si al menos uno de los segundos matchea, permitiendo un margen de error determinado 
      if(s1LikelyMatches[i][j]-errorMargin<s2Peaks[j]==s2Peaks[j]<s1LikelyMatches[i][j]+errorMargin){
        result.push(s1LikelyMatches[i]);
        break;
      }
    }
  }
  return result;
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


//Define la forma segun el porcentaje de puntos que hay en cada altura. Puedo encontrar el punto más alto y comparar con los de los lados. 
//Si hay mucha diferencia, es un pico, si no, es una meseta. Si el punto más alto está por debajo de 0.10, es un silencio. 
function definirRelieve(resultTemp:number[]){
  var max:number = findMinMax(resultTemp)[1];
  //if(max<0.)
}




readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\ChopSuey.wav").then((buffer) => {
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

  readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\ChopSueySample.wav").then((buffer) => {
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
  //console.log("Picos S2: ");
  //console.log(peaksS2);
  //console.log("Matches: ");
  //console.log(match(prepareComparison(peaksS1,peaksS2),peaksS2,100));
  //generarRelieves(valuesS1);
  statisticsTable(peaksS1,5);
  //generateWAV(audioDataS1.channelData[0],audioDataS1.channelData[1])

});
});