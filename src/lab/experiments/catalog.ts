import type {LabSimulationSettings} from './geometry';
export type ExperimentId='baseline'|'width8'|'width7'|'count20'|'raised'|'pressure'|'assist'|'enemy';
export const EXPERIMENTS:Readonly<Record<ExperimentId,{settings:LabSimulationSettings;description:string}>>=Object.freeze({
 baseline:{settings:{width:9,ringCount:12,pegLayout:'floor'},description:'Configuración aceptada. Sin ayudas ni enemigos.'},
 width8:{settings:{width:8,ringCount:12,pegLayout:'floor'},description:'Interior 8 de ancho (antes 9). Mantiene estacas, aros, fondo y bombeo.'},
 width7:{settings:{width:7,ringCount:12,pegLayout:'floor'},description:'Interior 7 de ancho. Compara recorrido lateral y congestión con doce aros.'},
 count20:{settings:{width:9,ringCount:20,pegLayout:'floor'},description:'Veinte aros con geometría original. La escena Apilar usa separación 0.35; el juego libre conserva el tamaño físico.'},
 raised:{settings:{width:9,ringCount:12,pegLayout:'raised'},description:'Bases elevadas a −3.8 y −2.2, sujetas al plástico posterior. Contacto físico en la base correspondiente.'},
 pressure:{settings:{width:9,ringCount:12,pegLayout:'floor'},description:'Compara 37.5 / 75 / 112.5 de fuerza. Misma duración 0.24 s, resistencia 0.50 y geometría.'},
 assist:{settings:{width:9,ringCount:12,pegLayout:'floor'},description:'Dos ayudas programadas explícitas: ensartar o soltar sobre la punta. El avance sigue las reglas físicas.'},
 enemy:{settings:{width:9,ringCount:12,pegLayout:'floor'},description:'Una travesura manual: añade uno o dos aros físicos rojos, sin borrar lo guardado. Solo en Juego libre.'},
});
export const experimentId=(value:string):ExperimentId=>Object.hasOwn(EXPERIMENTS,value)?value as ExperimentId:'baseline';
