import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { LoggerService} from 'src/app/services/logger.service'
import { MasService } from 'src/app/services/mas.service';
import { ActivatedRoute, Params} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Agents} from 'src/app/models/agents.model';
import { LogMessage } from 'src/app/models/logMessage.model';




@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css']
})
export class LoggerComponent implements OnInit {



    alive: boolean = true;
    selectedMASID: number = -1;
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
    agentID: number[];
    selectedID: number[] = [];
    selectedIDMap;
    notSelectedID: number[] = [];
    isAgentSelected: boolean[];

    isTopicSelected: boolean[] = [true, true, true, true, true];
    topics: string[] = ["error", "debug", "msg", "status", "app"];

    numLogs: number  = 4;

    width: number = 1500;
    height: number = 2000;
    boxWidth: number = 200;
    boxHeight: number = 100;
    logBoxWidth: number = 50;
    logBoxHeight: number = 25;
    interval: number;
    timeline = [];
    agentBox = [];
    logBoxes = [];
    communications = [];
    texts = [];  
    popoverContent: string = "This is the content of the popover";
    popoverTopic: string;

    allMsgs: LogMessage[] = [];
    msgs: LogMessage[] = [];

    constructor(
        private loggerService: LoggerService,
        private masService: MasService,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private http: HttpClient,
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
                this.selectedMASID = params.masid;  
/*                 this.masService.getAgents(params.masid).subscribe((res: Agents) => {
                    if (res.counter !== 0) {
                        this.agentID = res.instances.map(item => item.id);
                        for (let i = 0; i < res.counter; i++) {
                            this.isAgentSelected.push(false);
                        }
                        this.updateSelectedID();
                    }
                }); */
            });

        this.http.get("logs.json").subscribe( (res: LogMessage[] ) => {
            this.allMsgs = res;
        });
        this.agentID = [0, 1, 2, 3, 4];
        this.isAgentSelected = [false, false, false, false, false];
        this.updateSelectedID();
        
    }  
    
    
    
    
    onToggleTopic(i: number) {
        this.isTopicSelected[i] = ! this.isTopicSelected[i];
        this.updateScaledDates();
        
    }

    updateSelectedID() {
        this.selectedID = [];
        this.notSelectedID = [];
        
        for (let i = 0; i < this.agentID.length; i++) {
            if (this.isAgentSelected[i]) {
                this.selectedID.push(i);
            } else {
                this.notSelectedID.push(i);
            }
        }
        this.msgs = [];
        for (let msg of this.allMsgs) {
            if (this.selectedID.includes(msg.agentid)) {
                this.msgs.push(msg);
            }
        }
    }

    onDeleteID(i : number) {
        this.isAgentSelected[i] = !this.isAgentSelected[i];
        this.updateSelectedID();
        this.drawAllElements();

       
    }

    onSelectID(i : number) {
        this.isAgentSelected[i] = !this.isAgentSelected[i];
        this.updateSelectedID();
        this.drawAllElements();
    }

    drawAgentBox() {
        this.agentBox = [];
        this.texts = [];
        this.interval = 1 / (1 + this.selectedID.length) * this.width;

        for (let i=0; i < this.selectedID.length; i++) {
                const X: number = (i+1) * this.interval;
                // plot the agent box
                this.agentBox.push({x: X - this.boxWidth / 2, y: 200 - this.boxHeight});
                this.texts.push({
                    x: X - this.boxWidth * 5 / 12, 
                    y: 200 - this.boxHeight / 3,
                    textID: this.selectedID[i],
                })

        }
    }

    drawTimeline() {
        this.timeline = []
        for (let i = 0; i < this.selectedID.length; i++) {
                let X = (i+1) * this.interval;
                this.timeline.push({x1: X, y1:200, x2: X, y2: this.height })  
        }

    }

    generateScaledDates(msgs: LogMessage[]) :number[]{
        
        let dates: Date[] = []
        for (let i = 0; i < msgs.length; i++) {
            let date = new Date(msgs[i].timestamp)
            dates.push(date)
        }

        // find the date differences
        let datesInterval: number[] = [0];

        for (let i = 1; i < this.msgs.length; i++) {
            datesInterval.push(Math.round(dates[i-1].getTime()/1000) - Math.round(dates[i].getTime()/1000));
        }

        // find the maximum and minimum interval
        let minDiff : number = Number.MAX_SAFE_INTEGER;
        let maxDiff : number = 0

        for (let i = 0; i < datesInterval.length; i++) {
            if (datesInterval[i] > maxDiff) {
                maxDiff = datesInterval[i];
            }
            if (datesInterval[i] != 0 && datesInterval[i] < minDiff) {
                minDiff = datesInterval[i];
            }
        }

   
        // generate  scaledDates

        let scaledDates: number[] = [];
        let curr:number = 0;
        for (let i = 0; i < datesInterval.length; i++) {
            if (datesInterval[i] != 0) {
                curr = curr +  Math.round(100 * ((5 - 1)  * (datesInterval[i] - minDiff)/(maxDiff - minDiff) + 1)) / 100;
            }
                scaledDates.push(curr); 
        }

        this.height = 800 +  2 * this.logBoxHeight * scaledDates[scaledDates.length-1];
        return scaledDates;
    }

    drawScaledDates(scaledDates: number[]) {
        this.logBoxes = [];
        this.communications = [];
        for (let i = 0; i < scaledDates.length; i++) {
            let currMsg = this.msgs[i];
            let idx = this.selectedID.indexOf(currMsg.agentid) + 1;        
            this.logBoxes.push({
                x: this.interval *idx - this.logBoxWidth / 2, 
                y: 400 +  2 * this.logBoxHeight * scaledDates[i],
                topic: currMsg.topic,
                timestamp: currMsg.timestamp,
                msg: currMsg.msg,
                data: currMsg.data,
                hidden: !this.isTopicSelected[this.topics.indexOf(currMsg.topic)],
                
            });
            if (currMsg.topic === "msg" && currMsg.msg ==="ACL send"){
                let data = this.msgs[i].data.split(";");
                let sender = Number(data[0].charAt(data[0].length - 1));
                let senderIdx = this.selectedID.indexOf(sender) + 1;
                let receiver = Number(data[1].charAt(data[1].length-1));
                let receiverIdx = this.selectedID.indexOf(receiver) + 1;
                let direction = (senderIdx < receiverIdx) ? 1 : -1;
                if (this.selectedID.includes(receiver)) {
                    this.communications.push({
                        x1: this.interval * senderIdx + direction * this.logBoxWidth / 2,
                        y1: 400 +  2 * this.logBoxHeight * scaledDates[i] + this.logBoxHeight / 2,
                        x2: this.interval * receiverIdx - direction * this.logBoxWidth / 2,
                        y2: 400 +  2 * this.logBoxHeight * scaledDates[i] + + this.logBoxHeight / 2,
                        hidden: !this.isTopicSelected[this.topics.indexOf("msg")],
                    })
                }
            }
        }
    }


    updateScaledDates() {
        for (let i = 0; i < this.logBoxes.length; i++) {
                let idx = this.topics.indexOf(this.logBoxes[i].topic);
                this.logBoxes[i].hidden = !this.isTopicSelected[idx];
            }
        
       
        for (let i = 0; i < this.communications.length; i++) {
            let idx = this.topics.indexOf("msg")
            this.communications[i].hidden = !this.isTopicSelected[idx];
        }
    }
                
    drawAllElements() {
        this.drawAgentBox();
        let scaledDates: number[] = this.generateScaledDates(this.msgs);
        this.drawScaledDates(scaledDates);
        this.drawTimeline();
    }

    onChangePopoverContent(i) {
        if (this.msgs[i].data !== "") {
            this.popoverContent = this.msgs[i].data;
        } else {
            this.popoverContent = this.msgs[i].timestamp.toString();
        }

        this.popoverTopic = this.msgs[i].topic;
    }



    // functions for uploadning the log
    openLg(content) {
        this.modalService.open(content, { size: 'lg', centered: true });
    }



    onCreateLogs() {
        const result = JSON.parse(this.display);
        this.loggerService.createLogger(this.selectedMASID.toString(),result).subscribe(
            (res) => {
            console.log("success");
            console.log(res);
            this.modalService.dismissAll();
            },
            error => {
                console.log(error);
            }
        );
    }

       
    onSearchLogs(num: string) {
/*         this.numLogs = parseInt(num); 
        let params = new HttpParams();
        for (let i = 0; i < this.agentID.length; i++) {
            if (this.isAgentSelected[i]) {
                params.append("selectedID", this.agentID[i].toString());
            }
        }   
        this.loggerService.getAllLatestLogs(this.selectedMASID.toString(), this.numLogs.toString(), params).subscribe( (res: string[][]) => {
      
        })  */
    }





}