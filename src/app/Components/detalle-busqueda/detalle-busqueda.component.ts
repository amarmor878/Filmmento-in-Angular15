import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ApiTmdbBusquedaService } from 'src/app/Services/api-tmdb-busqueda.service';
import { DialogTrailerComponent } from '../dialog-trailer/dialog-trailer.component';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { faHeart, faPlay } from '@fortawesome/free-solid-svg-icons';
import { catchError, tap } from 'rxjs/operators';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-detalle-busqueda',
  templateUrl: './detalle-busqueda.component.html',
  styleUrls: ['./detalle-busqueda.component.css']
})
export class DetalleBusquedaComponent implements OnInit {
  // Iconos
  faHeart = faHeart;
  faPlay = faPlay;
  // Almacenar datos
  detalle: any;
  generos: any[] = [];
  // Mostrar datos
  tipo: string = '';
  esPelicula: boolean = false;
  esSerie: boolean = false;
  trailerUrl: SafeResourceUrl = '';
  logoUrl: string = '';
  modalOpen = false;

  constructor(
    private route: ActivatedRoute,
    private apiTmdbBusquedaService: ApiTmdbBusquedaService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private viewportScroller: ViewportScroller
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.tipo = params['tipo'];
      const id = params['id'];
      this.getBusquedaGlobalPorTipo(this.tipo, id);
    });
  }

  private getBusquedaGlobalPorTipo(tipo: string, id: string): void {
    this.apiTmdbBusquedaService
      .getBusquedaGlobalPorTipo(tipo, id)
      .pipe(
        tap((data: any) => {
          this.detalle = data;
          this.generos = this.detalle.genres;
          this.esPelicula = this.tipo === 'movie';
          this.esSerie = this.tipo === 'tv';
          this.getLogo(tipo, id);
        }),
        catchError((error) => {
          console.error(error);
          return [];
        })
      )
      .subscribe();
  }

  private getLogo(tipo: string, id: string): void {
    this.apiTmdbBusquedaService
      .getImagenes(tipo, id)
      .pipe(
        tap((data) => {
          const logos = data.logos;
          const logo = logos[logos.length - 1].file_path;
          this.logoUrl = `https://image.tmdb.org/t/p/w500${logo}`;
        }),
        catchError((error) => {
          console.error(error);
          return [];
        })
      )
      .subscribe();
  }

  getBackdropPath(): string {
    const backdropPath = this.detalle?.backdrop_path;
    return `url('https://image.tmdb.org/t/p/w1280/${backdropPath}')`;
  }

  openTrailerModal(): void {
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
    const currentPosition = this.viewportScroller.getScrollPosition();
    this.viewportScroller.scrollToPosition([0, 0]);
    this.apiTmdbBusquedaService
      .getBusquedaPorTrailer(this.tipo, this.detalle.id)
      .subscribe((data) => {
        const key = data.results[0].key;
        const trailerUrl = this.getSafeYoutubeUrl(key);
        const dialogConfig: MatDialogConfig = {
          width: '75%',
          height: '75%',
          position: { top: '50%', left: '50%' },
          panelClass: 'custom-modal',
          data: { trailerUrl }
        };
        const dialogRef = this.dialog.open(DialogTrailerComponent, dialogConfig);
        dialogRef.afterClosed().subscribe(() => {
          this.modalOpen = false;
          document.body.style.overflow = 'auto';
          this.viewportScroller.scrollToPosition(currentPosition);
        });
      });
  }

  private getSafeYoutubeUrl(key: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${key}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}