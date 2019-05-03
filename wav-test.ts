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

function findMinMax(array:number[]) {
  let min = array[0], max = array[0];

  for (let i = 1; i < array.length; i++) {
    let v = array[i];
    min = (v < min) ? v : min;
    max = (v > max) ? v : max;
  }
  return [min, max];
}

function getPeaks(array:number[]){
  console.log("Largo del array: " + array.length);
  let positivePeakCondition:number = findMinMax(array)[1]*0.60;
  let negativePeakCondition:number = findMinMax(array)[0]*0.60;
  console.log("positivePeakCondition: "+ positivePeakCondition + " negativePeakCondition: " + negativePeakCondition);
  let result:number[] = [];
  let peakCounter:number = 0;

  //Analiza todos los puntos del array para hallar picos
  for(let i=0;i<array.length;i++){

    for(let j=0;j<44100;j++){
      if(array[i]<negativePeakCondition || array[i]>positivePeakCondition){
        //console.log(array[i]);
        peakCounter += 1;
        
      }
      i++;
    }
    //Cada 44100 elementos (1 segundo) hace un push en el resultado para incluir la cantidad de picos en ese segundo
    result.push(peakCounter);
    peakCounter=0;
  }
  return result;
}

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

function reduce(s1:number[],s2:number[]){

  
}




function prepareComparison(s1:number[],s2:number[]){
  var result:number[][] = [];
  var resultTemp:number[] = [];
  for(var i=0;i<s1.length-s2.length+1;i++){
    for(var j=0;j<s2.length;j++){
      resultTemp.push(s1[i]);
      i++;
    }
    i-=s2.length;
    result.push(resultTemp);
    resultTemp = [];

  }
  return result;
}

function compare(s1:number[][],s2:number[],errorMargin:number){
  var result:number[][] = [];
  for(var i=0; i<s1.length;i++){
    for(var j=0;j<s2.length;j++){
      //Compara si al menos uno de los segundos matchea con 
      if(s1[i][j]-errorMargin<s2[j]==s2[j]<s1[i][j]+errorMargin){
        result.push(s1[i]);
        break;
      }
    }

  }
  return result;
}

readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\s1.wav").then((buffer) => {
  return WavDecoder.decode(buffer);
}).then(function(audioDataS1) {
  console.log("ampliando 30%");
  const size = 20000;

   //for(var i=0; i<audioData.channelData[0].length; i++) {
     //audioData.channelData[1][i]+=audioData.channelData[0][i];
     //audioData.channelData[0][i]*=20;
     //audioData.channelData[0][i]+=0.000000259254;
   //}

  for(var i=44100*5; i<44100*10; i++) {
    audioDataS1.channelData[0][i-44100*5] = audioDataS1.channelData[0][i];
  }

  for(var i=44100*11; i<44100*16; i++) {
    audioDataS1.channelData[0][i+44100*6] = audioDataS1.channelData[0][i];
  }

  readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\s2.wav").then((buffer) => {
    return WavDecoder.decode(buffer);
  }).then(function(audioDataS2) {
    //console.log("ampliando 30%");
    const size = 20000;
  
     //for(var i=0; i<audioData.channelData[0].length; i++) {
       //audioData.channelData[1][i]+=audioData.channelData[0][i];
       //audioData.channelData[0][i]*=20;
       //audioData.channelData[0][i]+=0.000000259254;
     //}
  
    for(var i=44100*5; i<44100*10; i++) {
      audioDataS2.channelData[0][i-44100*5] = audioDataS2.channelData[0][i];
    }
  
    for(var i=44100*11; i<44100*16; i++) {
      audioDataS2.channelData[0][i+44100*6] = audioDataS2.channelData[0][i];
    }


  //Para encontrar el average del array
  let valuesS1 = audioDataS1.channelData[0];
  let peaksS1 = getPeaks(valuesS1);

  let valuesS2 = audioDataS2.channelData[0];
  let peaksS2 = getPeaks(valuesS2);

  var s2Test = [20,305,424,1354];
  var s1Test = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  console.log("Picos S2: ");
  console.log(s2Test);
  console.log("Matches: ");
  console.log(compare(prepareComparison(peaksS1,s2Test),s2Test,100));

});
});