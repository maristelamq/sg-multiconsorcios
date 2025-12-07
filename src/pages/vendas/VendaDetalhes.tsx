import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Documento {
  id: string;
  tipo: string;
  nome_arquivo: string;
  arquivo_url: string | null;
  status: string;
  observacao: string | null;
  data_aprovacao: string | null;
  created_at: string;
}

interface Recebimento {
  id: string;
  parcela: number;
  valor_recebido: number;
  data_credito: string;
  conciliado: boolean;
}

interface Comissao {
  id: string;
  parcela: number;
  valor_previsto: number;
  status: string;
  tipo: string;
  vendedor: { nome: string } | null;
  representante: { nome: string } | null;
}

const TIPOS_DOCUMENTO = [
  { value: "CONTRATO", label: "Contrato" },
  { value: "PROPOSTA", label: "Proposta" },
  { value: "RG", label: "RG" },
  { value: "CPF", label: "CPF" },
  { value: "COMPROVANTE_ENDERECO", label: "Comprovante de Endereço" },
  { value: "COMPROVANTE_RENDA", label: "Comprovante de Renda" },
  { value: "OUTRO", label: "Outro" },
];

export default function VendaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [venda, setVenda] = useState<any>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [novoDocumento, setNovoDocumento] = useState({ tipo: "", arquivo: null as File | null });
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "detalhes");

  useEffect(() => {
    if (id) {
      fetchVenda();
      fetchDocumentos();
      fetchRecebimentos();
      fetchComissoes();
    }
  }, [id]);

  async function fetchVenda() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendas")
      .select(`
        *,
        cliente:clientes(nome, cpf_cnpj, contato),
        vendedor:vendedores(nome, cpf),
        representante:representantes(nome),
        empresa:empresas(nome, cnpj),
        cota:cotas(codigo, grupo, tipo, status)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar venda:", error);
      toast.error("Erro ao carregar venda");
    } else {
      setVenda(data);
    }
    setLoading(false);
  }

  async function fetchDocumentos() {
    const { data, error } = await supabase
      .from("documentos")
      .select("*")
      .eq("venda_id", id)
      .order("created_at", { ascending: false });

    if (!error) {
      setDocumentos(data || []);
    }
  }

  async function fetchRecebimentos() {
    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .eq("venda_id", id)
      .order("parcela", { ascending: true });

    if (!error) {
      setRecebimentos(data || []);
    }
  }

  async function fetchComissoes() {
    const { data, error } = await supabase
      .from("comissoes_receber")
      .select(`
        *,
        vendedor:vendedores(nome),
        representante:representantes(nome)
      `)
      .eq("venda_id", id)
      .order("parcela", { ascending: true });

    if (!error) {
      setComissoes(data || []);
    }
  }

  async function handleUploadDocumento() {
    if (!novoDocumento.tipo || !novoDocumento.arquivo) {
      toast.error("Selecione o tipo e o arquivo");
      return;
    }

    setUploading(true);
    try {
      // Upload do arquivo
      const fileExt = novoDocumento.arquivo.name.split(".").pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, novoDocumento.arquivo);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      // Salvar no banco
      const { error: insertError } = await supabase.from("documentos").insert({
        venda_id: id,
        tipo: novoDocumento.tipo,
        nome_arquivo: novoDocumento.arquivo.name,
        arquivo_url: urlData.publicUrl,
        status: "PENDENTE",
      });

      if (insertError) throw insertError;

      toast.success("Documento enviado com sucesso");
      setShowUploadDialog(false);
      setNovoDocumento({ tipo: "", arquivo: null });
      fetchDocumentos();
      
      // Atualizar status docs_status se for o primeiro documento
      if (venda?.docs_status === "PENDENTE") {
        await supabase.from("vendas").update({ docs_status: "EM_ANALISE" }).eq("id", id);
        fetchVenda();
      }
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      toast.error("Erro ao enviar documento");
    }
    setUploading(false);
  }

  async function handleAtualizarStatusDocumento(docId: string, status: string, observacao?: string) {
    const { error } = await supabase
      .from("documentos")
      .update({
        status,
        observacao,
        data_aprovacao: status === "APROVADO" ? new Date().toISOString() : null,
      })
      .eq("id", docId);

    if (error) {
      toast.error("Erro ao atualizar documento");
    } else {
      toast.success(`Documento ${status.toLowerCase()}`);
      fetchDocumentos();
      
      // Verificar se todos os documentos estão aprovados
      const todosAprovados = documentos.every(d => d.id === docId ? status === "APROVADO" : d.status === "APROVADO");
      if (todosAprovados && documentos.length > 0) {
        await supabase.from("vendas").update({ docs_status: "APROVADO" }).eq("id", id);
        fetchVenda();
      }
    }
  }

  async function handleExcluirDocumento(docId: string) {
    const { error } = await supabase.from("documentos").delete().eq("id", docId);
    if (error) {
      toast.error("Erro ao excluir documento");
    } else {
      toast.success("Documento excluído");
      fetchDocumentos();
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APROVADO":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "EM_ANALISE":
        return <Badge variant="secondary" className="bg-blue-600 text-white"><Clock className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case "REJEITADO":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (!venda) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Venda não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendas")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Venda - {venda.cota?.codigo}</h1>
          <p className="text-muted-foreground">{venda.cliente?.nome}</p>
        </div>
        {getStatusBadge(venda.docs_status || "PENDENTE")}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
          <TabsTrigger value="recebimentos">Recebimentos ({recebimentos.length})</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões ({comissoes.length})</TabsTrigger>
        </TabsList>

        {/* Tab Detalhes */}
        <TabsContent value="detalhes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Data da Venda:</span>
                  <span className="font-medium">{format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}</span>
                  
                  <span className="text-muted-foreground">Valor Crédito:</span>
                  <span className="font-medium">{formatCurrency(venda.valor_credito)}</span>
                  
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium">{formatCurrency(venda.valor_total)}</span>
                  
                  <span className="text-muted-foreground">Situação:</span>
                  <Badge variant={venda.situacao === "ATIVO" ? "default" : "destructive"}>{venda.situacao}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cota</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-medium">{venda.cota?.codigo}</span>
                  
                  <span className="text-muted-foreground">Grupo:</span>
                  <span className="font-medium">{venda.cota?.grupo}</span>
                  
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{venda.cota?.tipo}</span>
                  
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="font-medium">{venda.empresa?.nome}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{venda.cliente?.nome}</span>
                  
                  <span className="text-muted-foreground">CPF/CNPJ:</span>
                  <span className="font-medium">{venda.cliente?.cpf_cnpj || "-"}</span>
                  
                  <span className="text-muted-foreground">Contato:</span>
                  <span className="font-medium">{venda.cliente?.contato || "-"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendedor / Representante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium">{venda.vendedor?.nome || "-"}</span>
                  
                  <span className="text-muted-foreground">CPF Vendedor:</span>
                  <span className="font-medium">{venda.vendedor?.cpf || "-"}</span>
                  
                  <span className="text-muted-foreground">Representante:</span>
                  <span className="font-medium">{venda.representante?.nome || "-"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {venda.observacao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{venda.observacao}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Documento</Label>
                    <Select value={novoDocumento.tipo} onValueChange={(v) => setNovoDocumento({ ...novoDocumento, tipo: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Arquivo</Label>
                    <Input
                      type="file"
                      onChange={(e) => setNovoDocumento({ ...novoDocumento, arquivo: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancelar</Button>
                  <Button onClick={handleUploadDocumento} disabled={uploading}>
                    {uploading ? "Enviando..." : "Enviar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Envio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum documento enviado
                      </TableCell>
                    </TableRow>
                  ) : (
                    documentos.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo)?.label || doc.tipo}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {doc.nome_arquivo}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {doc.arquivo_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                            {doc.status === "PENDENTE" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleAtualizarStatusDocumento(doc.id, "APROVADO")}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleAtualizarStatusDocumento(doc.id, "REJEITADO")}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleExcluirDocumento(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Recebimentos */}
        <TabsContent value="recebimentos">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Data Crédito</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Conciliado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recebimentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum recebimento registrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    recebimentos.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.parcela}</TableCell>
                        <TableCell>{format(new Date(rec.data_credito), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rec.valor_recebido)}</TableCell>
                        <TableCell>
                          {rec.conciliado ? (
                            <Badge variant="default" className="bg-green-600">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Comissões */}
        <TabsContent value="comissoes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma comissão gerada
                      </TableCell>
                    </TableRow>
                  ) : (
                    comissoes.map((com) => (
                      <TableRow key={com.id}>
                        <TableCell className="font-medium">{com.parcela}</TableCell>
                        <TableCell>
                          <Badge variant={com.tipo === "VENDEDOR" ? "default" : "secondary"}>
                            {com.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{com.vendedor?.nome || com.representante?.nome || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(com.valor_previsto)}</TableCell>
                        <TableCell>
                          <Badge variant={com.status === "PAGO" ? "default" : com.status === "BLOQUEADO" ? "destructive" : "outline"}>
                            {com.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
