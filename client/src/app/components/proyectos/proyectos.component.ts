import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Nota } from 'src/app/models/nota';
import { Proyecto } from 'src/app/models/proyecto';
import { NotaService } from 'src/app/services/nota.service';
import { ProyectoService } from 'src/app/services/proyecto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proyectos',
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css'],
})
export class ProyectosComponent implements OnInit {
  registroModalAbierto = false;
  notaModalAbierto = false;
  proyectoModalAbierto = false;
  modificacionModalAbierto = false;
  proyectos: any = [];
  notas: any = [];
  proyectosArea: any = [];
  pk_proyecto: any;
  id_Proyecto: any;
  proyectoCreado: Proyecto = {};
  modificacionProyecto: any = [];
  displayedColumns: string[] = [
    'Nombre',
    'Fecha de inicio',
    'Fecha de finalizacion',
    'Estado',
    'Fecha de término',
    'Area',
    'Acciones',
  ];
  displayedColumnsArea: string[] = [
    'Nombre',
    'Fecha de inicio',
    'Fecha de finalizacion',
    'Estado',
    'Fecha de término',
    'Acciones',
  ];
  proyectosDataSource = new MatTableDataSource(this.proyectos);
  proyectosAreaDataSource = new MatTableDataSource(this.proyectosArea);

  datoSesion: any = [];
  datoSesionObject: any = [];
  rol: any = null;
  empresa: any = null;
  plan: any = null;

  notaCreada: Nota = {};
  proyecto: any = [];
  isCerrarButtonRed = true; 

  constructor(
    private proyectoService: ProyectoService,
    private notaService: NotaService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    // Validar si el usuario ha iniciado sesión
    this.datoSesion = sessionStorage.getItem('userData');
    this.datoSesionObject = JSON.parse(this.datoSesion);
    if (this.datoSesionObject) {
      this.rol = this.datoSesionObject.fk_rol || null;
      this.empresa = this.datoSesionObject.fk_empresa || null;
      this.plan = this.datoSesionObject.fk_suscripcion || null;
      console.log(this.plan)
    } else {
      this.router.navigate(['/403']);
      return;
    }

    if (this.rol == 3 || this.rol == 4) {
      this.obtenerProyectosArea();
    } else {
      this.obtenerProyectos();
    }
  }

  obtenerProyectos() {
    this.proyectoService.obtenerProyectos(this.empresa).subscribe(
      (res) => {
        this.proyectos = res;
        this.proyectosDataSource = new MatTableDataSource(this.proyectos);
        this.proyectosDataSource.paginator = this.paginator;
      },
      (err) => console.log(err)
    );
  }

  obtenerProyectosArea() {
    this.proyectoService
      .obtenerProyectosArea(this.datoSesionObject.fk_area)
      .subscribe(
        (res) => {
          this.proyectosArea = res;
          this.proyectosAreaDataSource = new MatTableDataSource(
            this.proyectosArea
          );
          this.proyectosAreaDataSource.paginator = this.paginator;
        },
        (err) => console.log(err)
      );
  }

  proyectosFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.proyectosDataSource.filter = filterValue.trim().toLowerCase();

    if (this.proyectosDataSource.paginator) {
      this.proyectosDataSource.paginator.firstPage();
    }
  }

  proyectosAreaFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.proyectosAreaDataSource.filter = filterValue.trim().toLowerCase();

    if (this.proyectosAreaDataSource.paginator) {
      this.proyectosAreaDataSource.paginator.firstPage();
    }
  }

  eliminarProyecto(pk_proyecto: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.proyectoService.eliminarProyecto(pk_proyecto).subscribe(
          (res) => {
            this.toastr.success(
              'El proyecto ha sido eliminado exitosamente',
              'Eliminado',
              {
                timeOut: 3000,
              }
            );
            // Actualizar la lista de proyectos
            if (this.rol == 3 || this.rol == 4) {
              this.obtenerProyectosArea();
            } else {
              this.obtenerProyectos();
            }
          },
          (error) => {
            this.toastr.error(
              'Hubo un problema al eliminar el proyecto',
              'Error',
              {
                timeOut: 3000,
              }
            );
          }
        );
      }
    });
  }

  abrirRegistroModal() {
    this.registroModalAbierto = true;
  }

  abrirModificacionModal(pk_proyecto: any) {
    this.modificacionModalAbierto = true;
    this.pk_proyecto = pk_proyecto;
    this.proyectoService.verProyecto(pk_proyecto).subscribe((res) => {
      this.modificacionProyecto = res;
      delete this.modificacionProyecto.pk_usuario;

      const fechaInicio = this.modificacionProyecto.fecha_inicio.toString();
      this.modificacionProyecto.fecha_inicio = fechaInicio.substring(0, 10);

      const fechaFin = this.modificacionProyecto.fecha_fin.toString();
      this.modificacionProyecto.fecha_fin = fechaFin.substring(0, 10);
      console.log(this.modificacionProyecto);
    });
  }

  abrirNotaModal(pk_proyecto: any) {
    this.notaModalAbierto = true;
    this.pk_proyecto = pk_proyecto;
    this.cargarNotas();
  }

  abrirProyectoModal(pk_proyecto: any) {
    this.pk_proyecto = pk_proyecto; // Aquí guardas el pk_proyecto
    // Llamada al servicio para obtener los detalles del proyecto por su pk_proyecto
    this.proyectoService.obtenerProyecto(pk_proyecto).subscribe(
      (res) => {
        this.proyecto = res; // Establecer los detalles obtenidos al proyectoDetalle
        this.proyectoModalAbierto = true; // Abrir el modal
      },
      (err) => {
        console.error('Error al obtener los detalles del proyecto', err);
        this.toastr.error('Error al cargar los detalles del proyecto', 'Error');
      }
    );
  }

  cargarNotas() {
    if (this.pk_proyecto) {
      this.notaService.obtenerNotas(this.pk_proyecto).subscribe((res) => {
        if (Array.isArray(res)) {
          this.notas = res.sort((a, b) => {
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          });
        } else {
          console.error('El resultado no es un array válido');
        }
      });
    } else {
      console.error('pk_proyecto no está definido');
    }
  }  

  cerrarNotaModal() {
    this.notaModalAbierto = false;
    this.notas = {};
    this.limpiarFormularioNota(); // Esto reiniciará el formulario
  }

  cerrarProyectoModal() {
    this.pk_proyecto = null;
    this.proyectoModalAbierto = false;
    this.proyecto = {}; // Reinicia el detalle del proyecto
  }

  cerrarRegistroModal() {
    this.registroModalAbierto = false;
    this.proyectoCreado = {};
  }

  cerrarModificacionModal() {
    this.modificacionModalAbierto = false;
  }

  crearProyecto() {
    this.proyectoCreado.estado = false;
    this.proyectoCreado.fk_area = this.datoSesionObject.fk_area;
    this.proyectoService.registrarProyecto(this.proyectoCreado).subscribe(
      (res) => {
        this.toastr.success(
          'El proyecto ha sido registrado exitosamente',
          'Éxito',
          { timeOut: 3000 }
        );
        this.registroModalAbierto = false;
        this.proyectoCreado = {};
        this.obtenerProyectosArea();
      },
      (err) => {
        this.toastr.error('No se pudo registrar el proyecto', 'Error', {
          timeOut: 3000,
        });
      }
    );
  }

  modificarProyecto() {
    this.proyectoService
      .modificarProyecto(this.pk_proyecto, this.modificacionProyecto)
      .subscribe(
        (res) => {
          this.toastr.success('Se modificó el proyecto exitosamente', 'Éxito', {
            timeOut: 3000,
          });
          this.modificacionModalAbierto = false;
          this.modificacionProyecto = {};
          this.obtenerProyectosArea();
        },
        (err) => {
          console.log(this.modificacionProyecto);
          this.toastr.warning(
            'No se pudieron actualizar los datos del proyecto',
            'Error',
            {
              timeOut: 3000,
            }
          );
          console.log(err);
        }
      );
  }

  // Darle Color a las Notas
  getCardClassByPriority(priority: number): string {
    if (priority === 1) {
      return 'prioridad-alta';
    } else if (priority === 2) {
      return 'prioridad-media';
    } else if (priority === 3) {
      return 'prioridad-baja';
    } else {
      return ''; // O alguna clase por defecto si es necesario
    }
  }

  //Obtener Notas
  obtenerNotas() {
    this.notaService.obtenerNotas(this.pk_proyecto).subscribe(
      (res) => {
        this.notas = res;
      },
      (err) => console.log(err)
    );
  }

  //Agregar Nota
  agregarNota() {
    const ahora = new Date();
    // Ajustar la hora a la zona horaria local
    const fechaLocal = new Date(
      ahora.getTime() - ahora.getTimezoneOffset() * 60000
    );
    this.notaCreada.fecha = fechaLocal.toISOString().split('T')[0];
    this.notaCreada.fk_proyecto = this.pk_proyecto;
    this.notaService.registrarNota(this.notaCreada).subscribe(
      (res) => {
        this.toastr.success('La nota ha sido agregada exitosamente', 'Éxito', {
          timeOut: 3000,
        });
        this.notaModalAbierto = false;
        this.obtenerNotas();
        this.limpiarFormularioNota();
      },
      (err) => {
        this.toastr.error('No se pudo agregar la nota', 'Error', {
          timeOut: 3000,
        });
      }
    );
  }

  limpiarFormularioNota() {
    this.notaCreada = this.notas = {};
  }

  obtenerProyecto() {
    this.proyectoService.obtenerProyecto(this.pk_proyecto).subscribe(
      (res) => {
        this.proyecto = res;
      },
      (error) => {
        this.toastr.error('Error al cargar los detalles del proyecto', 'Error');
      }
    );
  }

  // Asegúrate de que tienes las importaciones correctas en la parte superior de tu archivo
  // ...

  // Dentro de tu componente de Angular
  culminarProyecto(pk_proyecto: any) {
    // Verifica que pk_proyecto tenga un valor válido antes de continuar
    if (!pk_proyecto) {
      this.toastr.error(
        'No se ha especificado el proyecto para culminar.',
        'Error'
      );
      return;
    }

    // Mostrar SweetAlert2 para confirmación
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Una vez culminado, no podrás revertir este proyecto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, culminar',
      cancelButtonText: 'No, cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí llamamos al servicio para modificar el estado del proyecto
        this.proyectoService
          .modificarEstadoProyecto(pk_proyecto, this.proyecto)
          .subscribe({
            next: (res) => {
              this.toastr.success(
                'El proyecto ha sido culminado con éxito.',
                'Proyecto Culminado'
              );
              this.obtenerProyectosArea();
            },

            error: (error) => {
              this.toastr.error(
                'Hubo un problema al culminar el proyecto.',
                'Error'
              );
            },
          });
      }
    });
  }
}
