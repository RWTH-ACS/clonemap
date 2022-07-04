import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit {
    active: string = 'overview';
    id: number;

    constructor(private router: Router) { 
        this.router.events.subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
            const nav: string = this.router.url.split("/")[1];
            const navbar: string[] = ["overview", "ams", "log", "df"];
            this.id = Number(this.router.url.split("/")[2]);
             if (navbar.includes(nav) ) {
                this.active = nav;
            }
        }
        });
    }

    ngOnInit(){

    }

}