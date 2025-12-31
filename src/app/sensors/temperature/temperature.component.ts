import { 
  Component,
  OnInit,
  AfterViewInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.css']
})
export class TemperatureComponent implements OnInit {
  TemperatureData: any[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize = 10;
  dataLoaded = false;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  this.http.get<any[]>('http://localhost:5000/api/temperature/history').subscribe({
      next: (data) => {
        this.TemperatureData = data;
        this.dataLoaded = true;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load humidity data', err);
        this.TemperatureData = [];
      }
    });
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  parseSearchDate(input: string): string | null {
    const monthMap: any = {
      jan: '01', january: '01', feb: '02', february: '02',
      mar: '03', march: '03', apr: '04', april: '04',
      may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', september: '09',
      oct: '10', october: '10', nov: '11', november: '11',
      dec: '12', december: '12'
    };

    const tokens = input.toLowerCase().split(/[\s\-\/]+/);
    let day = '', month = '', year = '';
    for (const token of tokens) {
      if (!isNaN(+token) && +token > 31) year = token;
      else if (!isNaN(+token) && +token <= 31 && !day) day = token.padStart(2, '0');
      else if (!isNaN(+token) && +token <= 12 && !month) month = token.padStart(2, '0');
      else if (monthMap[token]) month = monthMap[token];
    }

    return (day && month && year) ? `${year}-${month}-${day}` : null;
  }

  getFilteredData(): any[] {
    const query = this.searchQuery.trim();
    if (!query) return this.TemperatureData || [];

    const targetDate = this.parseSearchDate(query);
    if (!targetDate) return [];

    return this.TemperatureData.filter((row) =>
      row.timestamp.startsWith(targetDate)
    );
  }

  getPaginatedData(): any[] {
    const filtered = this.getFilteredData();
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  getPageCount(): number {
    const total = this.getFilteredData()?.length || 0;
    return Math.ceil(total / this.pageSize);
  }

  setPage(page: number) {
    this.currentPage = page;
  }

  getVisiblePages(): number[] {
    const totalPages = this.getPageCount();
    const current = this.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push(-1);
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 3) pages.push(-1);
      pages.push(totalPages);
    }

    return pages;
  }
}

