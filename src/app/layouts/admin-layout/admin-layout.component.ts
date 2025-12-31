import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Location, PopStateEvent } from '@angular/common';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import PerfectScrollbar from 'perfect-scrollbar';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, AfterViewInit {

  private lastPoppedUrl: string;
  private yScrollStack: number[] = [];
  private _router: Subscription;

  constructor(
    public location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {

    const elemMainPanel = document.querySelector('.main-panel') as HTMLElement;
    const elemSidebar = document.querySelector('.sidebar-wrapper') as HTMLElement;

    this.location.subscribe((ev: PopStateEvent) => {
      this.lastPoppedUrl = ev.url;
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (event.url !== this.lastPoppedUrl) {
          this.yScrollStack.push(window.scrollY);
        }
      } else if (event instanceof NavigationEnd) {
        if (event.url === this.lastPoppedUrl) {
          this.lastPoppedUrl = undefined;
          window.scrollTo(0, this.yScrollStack.pop());
        } else {
          window.scrollTo(0, 0);
        }
      }
    });

    this._router = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (elemMainPanel) elemMainPanel.scrollTop = 0;
        if (elemSidebar) elemSidebar.scrollTop = 0;
      });

    if (window.matchMedia('(min-width: 960px)').matches) {
      new PerfectScrollbar(elemMainPanel);
      new PerfectScrollbar(elemSidebar);
    }
  }

  ngAfterViewInit(): void {
    this.runOnRouteChange();
  }

  isMaps(path: string): boolean {
    const title = this.location.prepareExternalUrl(this.location.path()).slice(1);
    return path !== title;
  }

  runOnRouteChange(): void {
    const elemMainPanel = document.querySelector('.main-panel') as HTMLElement;
    if (elemMainPanel) {
      const ps = new PerfectScrollbar(elemMainPanel);
      ps.update();
    }
  }
}
