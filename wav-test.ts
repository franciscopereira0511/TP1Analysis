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
    console.log(max);
  }
  console.log([min,max]);
  return [min, max];
}

function getPeaks(array:number[]){
  console.log("Largo del array: " + array.length);
  console.log("Minimo y Maximo: " + findMinMax(array));
  let peakCondition:number = findMinMax(array)[1]*0.75;
  console.log("Peak condition: "+ peakCondition);
  let result:number[] = [];
  let peakCounter:number = 0;

  //Analiza todos los puntos del array para hallar picos
  for(let i=0;i<array.length;i++){

    for(let j=0;j<44100;j++){
      if(array[i]>peakCondition){
        //console.log(array[i]);
        peakCounter += 1;
        
      }
      i++;
    }
    //Cada 44100 elementos (1 segundo) hace un push en el resultado para incluir la cantidad de picos en ese segundo
    result.push(peakCounter);
    peakCounter=0;

  }
  console.log(result);
  return result;
}



readFile("C:\\Users\\User\\Desktop\\Clases 5to Semestre\\Análisis de Algoritmos\\alg2019-master\\ChopSueySample.wav").then((buffer) => {
  return WavDecoder.decode(buffer);
}).then(function(audioData) {
  console.log("ampliando 30%");
  const size = 20000;

   //for(var i=0; i<audioData.channelData[0].length; i++) {
     //audioData.channelData[1][i]+=audioData.channelData[0][i];
     //audioData.channelData[0][i]*=20;
     //audioData.channelData[0][i]+=0.000000259254;
   //}

  for(var i=44100*5; i<44100*10; i++) {
    audioData.channelData[0][i-44100*5] = audioData.channelData[0][i];
  }

  for(var i=44100*11; i<44100*16; i++) {
    audioData.channelData[0][i+44100*6] = audioData.channelData[0][i];
  }

  //Para encontrar el average del array
  let values = audioData.channelData[0];
  //getPeaks(values);

  for(var k = 0; k<values.length; k++){
    console.log(values[i]);
  }

  // console.log("writing...");
  // WavEncoder.encode(audioData).then((buffer: any) => {
  //   fs.writeFileSync("C:\\Dev\\newsulky.wav", new Buffer(buffer));
  // });

  });