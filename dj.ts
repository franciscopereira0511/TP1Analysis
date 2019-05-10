import {} from "./wav-test"

export class Dj {
    private mix: number[][];

    public constructor() {
        this.mix = [];
    }

    public getMix() {
        return this.mix;
    }

    public ranking(s1: number[][]) {
        var section: number[][] = [];
        var values: number[] = [];
        for(let i = 0; i < 44100*2; i++) {
            values.push(s1[0][i]);
        }
        section.push(values);
        values = [];
        for(let i = 0; i < 44100*2; i++) {
            values.push(s1[1][i]);
        }
        section.push(values);
    }

    private rankingAux(s1: number[][], section:number[][]) {
        
    }

    private pushmixL(value: number){
        this.mix[0].push(value);
    }

    private pushmixR(value: number){
        this.mix[1].push(value);
    }

    private domix(top: number[][]){
        this.mix.push([0,1]);
        let isloop: boolean = true;
        let channel: number = 0;
        let silence: number = 0;
        let sectionIndex: number = 0;
        for(let i = 0; i < 30; i++) {
            this.mix[0].push(silence);
            this.mix[1].push(silence);
            if(isloop) {
                sectionIndex = Math.floor(Math.random()*top.length);
                if(channel == 0) {
                    top[sectionIndex].forEach(this.pushmixL);
                    top[sectionIndex].forEach(this.pushmixL);
                    top[sectionIndex].forEach(this.pushmixL);
                    this.mix[1].push(silence);
                    this.mix[1].push(silence);
                    this.mix[1].push(silence);
                    channel++;
                } else if(channel == 1) {
                    this.mix[0].push(silence);
                    this.mix[0].push(silence);
                    this.mix[0].push(silence);
                    top[sectionIndex].forEach(this.pushmixR);
                    top[sectionIndex].forEach(this.pushmixR);
                    top[sectionIndex].forEach(this.pushmixR);
                    channel++;
                } else {
                    top[sectionIndex].forEach(this.pushmixL);
                    top[sectionIndex].forEach(this.pushmixL);
                    top[sectionIndex].forEach(this.pushmixL);
                    top[sectionIndex].forEach(this.pushmixR);
                    top[sectionIndex].forEach(this.pushmixR);
                    top[sectionIndex].forEach(this.pushmixR);
                    channel = 0;
                }
                isloop = false;
            } else {
                if(channel == 0) {
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixL);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixL);
                    this.mix[1].push(silence);
                    this.mix[1].push(silence);
                    channel++;
                } else if(channel == 1) {
                    this.mix[0].push(silence);
                    this.mix[0].push(silence);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixR);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixR);
                    channel++;
                } else {
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixL);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixL);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixR);
                    sectionIndex = Math.floor(Math.random()*top.length);
                    top[sectionIndex].forEach(this.pushmixR);
                    channel = 0;
                }
                isloop = true;
            }

        }
    }

    public match(s1LikelyMatches:number[][],s2Peaks:number[],errorMargin:number){
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

    public prepareComparison(s1Peaks:number[],s2Peaks:number[]){
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

    public getPeaks(array:number[]){

        let positivePeakCondition:number = this.findMinMax(array)[1]*0.60;
        let negativePeakCondition:number = this.findMinMax(array)[0]*0.60;
        let result:any[][] = [];
        let peakCounter:number = 0;
        let firstPeak:number = 0;
      
        //Recorre los puntos del array para hallar picos
        for(let i=0;i<array.length;i++){
          //Divide los picos por segundo
          for(let j=0;j<44100*2;j++){
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

    private findMinMax(array:number[]) {
        let min = array[0], max = array[0];
        
        for (let i = 1; i < array.length; i++) {
            let v = array[i];
            min = (v < min) ? v : min;
            max = (v > max) ? v : max;
        }
        return [min, max];
    }
}