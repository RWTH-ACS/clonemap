import { Component, OnInit } from '@angular/core';
import { LoggerService} from 'src/app/services/logger.service'
import { MasService } from 'src/app/services/mas.service';
import { ActivatedRoute, Params} from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css']
})
export class LoggerComponent implements OnInit {

    alive: boolean = true;
    selectedMASId: number = -1;
    MASs = null;
    searched_results;

    fileToUpload: File = null;
    display: string = "";
    filename: string = "Choose a file...";

    errorSelected: boolean = true;
    debugSelected: boolean = true;
    msgSelected: boolean = true;
    statusSelected: boolean = true;
    appSelected: boolean = true;
    selectedAgentID: number[] = [1, 2, 3, 4];
    agentID: number[] = [1, 2, 3, 4];
    isAgentSelected: boolean[] = [true, true, true, true];
    isTopicSelected: boolean[] = [true, true, true, true, true];

    numLogs: number  = 2;

    width: number = 1500;
    height: number = 2000;
    boxWidth: number = 200;
    boxHeight: number = 100;
    logBoxWidth: number = 50;
    logBoxHeight: number = 25;
    interval: number;
    timeline = [];
    agentBox = [];
    texts = [];   

    scaledDates: number[][];
    errLogBox = [];
    debugLogBox = [];
    msgLogBox = [];
    statusLogBox = [];
    appLogBox = [];





    constructor(
        private loggerService: LoggerService,
        private masService: MasService,
        private route: ActivatedRoute,
        private modalService: NgbModal
        ) { }

    ngOnInit(): void {

        // check whether the logger is alive
        this.loggerService.getAlive().subscribe( (res:any) => {
            this.alive = res.logger;
        });

        // update the sidebar
        this.masService.getMAS().subscribe((MASs: any) => {
            this.MASs = MASs;
            },
            err => {
                console.log(err)  
        });
        
        // get the selectedMASid from the current route
        this.route.params.subscribe((params: Params) => {
                this.selectedMASId = params.masId;             
            });

        let Dates = this.generateRandomDates(); 
        this.scaledDates = this.generateScaledDates(Dates);
        this.drawAgentBox();
        this.drawScaledDates(this.scaledDates);
        this.drawTimeline();
    }    
    
    
    onToggleTopic(i: number) {
        this.isTopicSelected[i] = ! this.isTopicSelected[i];
    }

    onSelectID(i : number) {
        this.isAgentSelected[i] = !this.isAgentSelected[i];
        this.drawAgentBox();
        this.drawScaledDates(this.scaledDates);
        this.drawTimeline();
        
    }

    drawAgentBox() {
        this.agentBox = [];
        this.texts = [];
        let cnt = 0;
        for (let i of this.isAgentSelected) {
            if (i) {
                cnt++;
            }
        }
        this.interval = 1 / (1 + cnt) * this.width;

        cnt = 1;
        for (let i=0; i <= this.agentID.length; i++) {
            if (this.isAgentSelected[i]) {
                const X: number = cnt * this.interval;
                // plot the agent box
                this.agentBox.push({x: X - this.boxWidth / 2, y: 200 - this.boxHeight});
                this.texts.push({x: X - this.boxWidth / 4,y: 200 - this.boxHeight/2, textID:this.agentID[i]})
                cnt++;
            }
        }
    }

    drawTimeline() {
        this.timeline = []
        let cnt = 1;
        for (let i = 0; i < this.agentID.length; i++) {
            if (this.isAgentSelected[i]) {
                let X = cnt * this.interval;
                this.timeline.push({x1: X, y1:200, x2: X, y2: this.height })
                cnt++;
            }
        }

    }

    generateScaledDates(dates: Date[][]) :number[][]{
        
        // sort the dates from the latest to the oldest

        // find the latest log of all the agents
        let globalLastest: Date = new Date("2015-03-25T12:00:00Z") ;
        for (let i = 0; i < this.selectedAgentID.length * 5; i++) {
            if (dates[i] != []) {
                if (dates[i][0].getTime() - globalLastest.getTime() > 0) {
                    globalLastest = dates[i][0];
                } 
            }
        }

        // find the date differences
        let datesInterval: number[][] = [];

        for (let j = 0; j < this.selectedAgentID.length * 5; j++) {
            datesInterval.push([]);
            datesInterval[j].push(Math.round(globalLastest.getTime()/1000) - Math.round(dates[j][0].getTime()/1000));
            for (let i = 1; i < this.numLogs; i++) {
                datesInterval[j].push(Math.round(dates[j][i-1].getTime()/1000) - Math.round(dates[j][i].getTime()/1000));
                }
            }

        // find the largest and smallest interval of logs

        let smallestDiff : number = Number.MAX_SAFE_INTEGER;
        let largestDiff : number = 0

        for (let j = 0; j < this.selectedAgentID.length * 5; j++) {
            for (let i = 0; i < this.numLogs; i++) {
                if (datesInterval[j][i] > largestDiff) {
                    largestDiff = datesInterval[j][i];
                }
                if (datesInterval[j][i] !== 0 && datesInterval[j][i] < smallestDiff) {
                    smallestDiff = datesInterval[j][i];
                }
            }
        }

   
        // generate  scaledDates

        let scaledDates: number[][] = []
        for (let j = 0; j < this.agentID.length * 5; j++) {
            scaledDates.push([]);
            scaledDates[j].push(Math.round(100 * ((20 - 1)  * (datesInterval[j][0] - smallestDiff)/(largestDiff - smallestDiff) + 1)) / 100);
            for (let i = 0; i < this.numLogs; i++) {  
                let scaledDiff: number = Math.round(100 * ((20 - 1)  * (datesInterval[j][i] - smallestDiff)/(largestDiff - smallestDiff) + 1)) / 100;
                scaledDates[j].push(scaledDates[j][i] + scaledDiff);
                
            }
        }
        return scaledDates;

    }

    drawScaledDates(resDates: number[][]) {
        this.errLogBox = [];
        this.debugLogBox = [];
        this.msgLogBox = [];
        this.statusLogBox = [];
        this.appLogBox = [];
        let allBoxes = [this.errLogBox, this.debugLogBox, this.msgLogBox, this.statusLogBox, this.appLogBox];
        for (let k = 0; k < this.isTopicSelected.length; k++) {
            //allBoxes[k] = [];
            let scaledDates =  resDates.slice(k * this.selectedAgentID.length, (k+1) * this.selectedAgentID.length);
            let cnt: number = 0;
            for (let j = 0; j < this.agentID.length; j++) {
                if (this.isAgentSelected[j]) {
                    allBoxes[k].push([]);
                    for (let i = 0; i < this.numLogs; i++) {
                        allBoxes[k][cnt].push({x: this.interval * (cnt+1) - this.logBoxWidth / 2, y: 400 +  2 * this.logBoxHeight * scaledDates[j][i]});
                    }
                    if (allBoxes[k][cnt][this.numLogs-1].y > this.height) {
                        this.height = allBoxes[k][cnt][this.numLogs-1].y + 300;
                    }
                    cnt++;
                }
            }
        }
    }



    // functions for uploadning the log
    openLg(content) {
        this.modalService.open(content, { size: 'lg', centered: true });
    }

    onUpdateContent(content:string) {
        this.display=content;
    }
    
    handleFileInput(files: FileList) {
        if (files.length <= 0) {
            return false;
        }
        this.fileToUpload = files.item(0);
        let fr = new FileReader();
        fr.onload = () => {
            this.display = fr.result.toString();
            this.filename = this.fileToUpload.name;
        }
        fr.readAsText(this.fileToUpload);
    }

    onCreateLogs() {
        const result = JSON.parse(this.display);
        this.loggerService.createLogger(this.selectedMASId.toString(),result).subscribe(
            (res) => {
            console.log("success");
            console.log(res);
            this.modalService.dismissAll("uploaded");
            },
            error => {
                console.log(error);
            }
        );
    }

       
    onSearchLogs(num: string) {
        this.numLogs = parseInt(num);    
        this.drawAgentBox();
        const dates = this.generateRandomDates();
        this.scaledDates = this.generateScaledDates(dates);
        this.drawScaledDates(this.scaledDates);
        this.drawTimeline();   
    }

    randomDate(start: Date, end: Date) : Date {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    generateRandomDates() :Date[][] {

        
        let dates: Date[][] = [];
        const k: number = this.isTopicSelected.length;
        for (let j = 0; j < k * this.selectedAgentID.length; j++) {
            dates.push([]);
            for (let i = 0; i < this.numLogs; i++) {
                dates[j].push(this.randomDate(new Date("2015-03-25T12:00:00Z"), 
                new Date(Date.now()) ));
            }   
        }



        for (let date of dates) {
            date.sort( function (date1:Date, date2: Date) {
                return date2.getTime() - date1.getTime();
            })
        }
        return dates;
    }



}
