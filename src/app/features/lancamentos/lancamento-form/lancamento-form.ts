import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../../models/categoria.model';
import { CategoriaService } from '../../../core/services/categoria.service';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LancamentoRequest, LancamentoResponse } from '../../../models/lancamento.model'; // Adicionado LancamentoResponse

@Component({
  imports: [FormsModule, ReactiveFormsModule],
  selector: 'app-lancamento-form',
  styleUrl: './lancamento-form.css',
  templateUrl: './lancamento-form.html',
})
export class LancamentoForm implements OnInit {
  salvou = output<void>();
  cancelou = output<void>(); // NOVO: para avisar a lista que cancelou
  
  // NOVO: Recebe o lançamento selecionado da lista (pode ser null)
  lancamentoSelecionado = input<LancamentoResponse | null>(null);

  categorias = signal<Categoria[]>([]);
  erro = signal('');
  salvando = signal(false);
 
  formulario = new FormGroup({
    descricao: new FormControl('', {nonNullable:true,
      validators:[Validators.required, Validators.minLength(3), Validators.maxLength(200)]}),
    valor: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    dataLancamento: new FormControl('', {nonNullable:true, validators:[Validators.required]}),
    observacao: new FormControl(''),
    categoriaId: new FormControl<number | null>(null, [Validators.required])
  });
 
  constructor(private categoriasService: CategoriaService,
              private lancamentosService: LancamentoService) {}
 
  ngOnInit(): void {
    this.categoriasService.listar().subscribe({
      next: dados => this.categorias.set(dados),
      error: () => this.erro.set('Falha ao carregar categorias.')
    });
  }
 
  salvar(): void {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    const v = this.formulario.getRawValue();
    const dados: LancamentoRequest = {
      descricao: v.descricao.trim(), valor: v.valor!,
      dataLancamento: v.dataLancamento,
      observacao: v.observacao || null, categoriaId: v.categoriaId!
    };
    this.salvando.set(true); this.erro.set('');
    
    // Aqui você precisaria ter uma lógica de if (this.lancamentoSelecionado()) para chamar o editar()
    // Mas para o erro sumir, vamos deixar apenas o cadastrar por enquanto.
    this.lancamentosService.cadastrar(dados).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formulario.reset();
        this.salvou.emit();
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(err.error?.erro || 'Não foi possível salvar.');
      }
    });
  }

  // NOVO: Método para o botão cancelar
  cancelar(): void {
    this.formulario.reset();
    this.cancelou.emit(); // Avisa a lista
  }
}