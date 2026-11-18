import { Component, input, output, OnInit, signal, effect } from '@angular/core'; // Tem que ter o effect aqui!
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CategoriaService } from '../../../core/services/categoria.service';
import { Categoria } from '../../../models/categoria.model';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LancamentoRequest, LancamentoResponse } from '../../../models/lancamento.model';

@Component({
  selector: 'app-lancamento-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './lancamento-form.html'
})
export class LancamentoForm implements OnInit {
  usuarioId = input.required<number>();
  salvou = output<void>();
  cancelou = output<void>();

  categorias = signal<Categoria[]>([]);
  erro = signal('');
  salvando = signal(false);

  private _lancamentoId: number | null = null;

  // O input DEVE ser público e usar null!
  lancamentoSelecionado = input<LancamentoResponse | null>(null!);

  constructor(private categoriasService: CategoriaService,
              private lancamentosService: LancamentoService) {
    // Effect no construtor
    effect(() => {
      const l = this.lancamentoSelecionado(); // Lê o input público
      this._lancamentoId = l ? l.id : null;
      if (l) {
        this.formulario.patchValue({
          descricao: l.descricao,
          valor: l.valor,
          dataLancamento: l.dataLancamento,
          observacao: l.observacao ?? '',
          categoriaId: l.categoriaId
        });
      } else {
        this.formulario.reset();
      }
    });
  }

  ngOnInit(): void {
    // Filtra ativas (Item F)
    this.categoriasService.listar().subscribe({
      next: dados => this.categorias.set(dados.filter(c => c.ativa)),
      error: () => this.erro.set('Falha ao carregar categorias.')
    });
  }

  formulario = new FormGroup({
    descricao: new FormControl('', {nonNullable:true,
      validators:[Validators.required, Validators.minLength(3), Validators.maxLength(200)]}),
    valor: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    dataLancamento: new FormControl('', {nonNullable:true, validators:[Validators.required]}),
    observacao: new FormControl(''),
    categoriaId: new FormControl<number | null>(null, [Validators.required])
  });

  salvar(): void {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    if (this.salvando()) return; 

    const v = this.formulario.getRawValue();
    const dados: LancamentoRequest = {
      descricao: v.descricao.trim(), valor: v.valor!,
      dataLancamento: v.dataLancamento,
      observacao: v.observacao || null, categoriaId: v.categoriaId!
    };
    this.salvando.set(true); this.erro.set('');

    const request$ = this._lancamentoId
      ? this.lancamentosService.atualizar(this.usuarioId(), this._lancamentoId, dados)
      : this.lancamentosService.cadastrar(this.usuarioId(), dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formulario.reset();
        this._lancamentoId = null;
        this.salvou.emit();
      },
      error: err => {
        this.salvando.set(false);
        if (err.status === 400 || err.status === 404) {
          this.erro.set('Dados inválidos ou lançamento não encontrado.');
        } else {
          this.erro.set(err.error?.erro || 'Não foi possível salvar.');
        }
      }
    });
  }

  cancelar(): void {
    this.formulario.reset();
    this._lancamentoId = null;
    this.cancelou.emit();
  }
}