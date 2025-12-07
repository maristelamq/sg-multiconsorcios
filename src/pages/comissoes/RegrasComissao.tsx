import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Settings2, Layers } from "lucide-react";

interface Faixa {
  id?: string;
  ordem: number;
  percentual: number;
  parcelas: number;
  meses_carencia: number;
}

interface Regra {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  empresa_id: string | null;
  administradora_id: string | null;
  grupo_filtro: string | null;
  empresas?: { nome: string } | null;
  administradoras?: { nome: string } | null;
  faixas_comissao?: Faixa[];
}

interface Empresa {
  id: string;
  nome: string;
}

interface Administradora {
  id: string;
  nome: string;
}

export default function RegrasComissao() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [administradoras, setAdministradoras] = useState<Administradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "VENDEDOR",
    ativo: true,
    empresa_id: "",
    administradora_id: "",
    grupo_filtro: ""
  });
  const [faixas, setFaixas] = useState<Faixa[]>([
    { ordem: 1, percentual: 3, parcelas: 10, meses_carencia: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [regrasRes, empRes, admRes] = await Promise.all([
      supabase.from("regras_comissao").select("*, empresas(nome), administradoras(nome), faixas_comissao(*)").order("nome"),
      supabase.from("empresas").select("id, nome").order("nome"),
      supabase.from("administradoras").select("id, nome").order("nome")
    ]);

    if (regrasRes.error) {
      toast.error("Erro ao carregar regras");
      return;
    }
    setRegras(regrasRes.data || []);
    setEmpresas(empRes.data || []);
    setAdministradoras(admRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (faixas.length === 0) {
      toast.error("Adicione pelo menos uma faixa");
      return;
    }

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      ativo: formData.ativo,
      empresa_id: formData.empresa_id || null,
      administradora_id: formData.administradora_id || null,
      grupo_filtro: formData.grupo_filtro || null
    };

    try {
      if (editingId) {
        // Atualizar regra
        const { error } = await supabase.from("regras_comissao").update(payload).eq("id", editingId);
        if (error) throw error;

        // Deletar faixas antigas e inserir novas
        await supabase.from("faixas_comissao").delete().eq("regra_id", editingId);
        
        const faixasPayload = faixas.map((f, i) => ({
          regra_id: editingId,
          ordem: i + 1,
          percentual: f.percentual,
          parcelas: f.parcelas,
          meses_carencia: f.meses_carencia
        }));
        
        const { error: faixaError } = await supabase.from("faixas_comissao").insert(faixasPayload);
        if (faixaError) throw faixaError;

        toast.success("Regra atualizada");
      } else {
        // Criar regra
        const { data: newRegra, error } = await supabase
          .from("regras_comissao")
          .insert(payload)
          .select()
          .single();
        
        if (error || !newRegra) throw error;

        // Inserir faixas
        const faixasPayload = faixas.map((f, i) => ({
          regra_id: newRegra.id,
          ordem: i + 1,
          percentual: f.percentual,
          parcelas: f.parcelas,
          meses_carencia: f.meses_carencia
        }));
        
        const { error: faixaError } = await supabase.from("faixas_comissao").insert(faixasPayload);
        if (faixaError) throw faixaError;

        toast.success("Regra criada");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: "",
      tipo: "VENDEDOR",
      ativo: true,
      empresa_id: "",
      administradora_id: "",
      grupo_filtro: ""
    });
    setFaixas([{ ordem: 1, percentual: 3, parcelas: 10, meses_carencia: 0 }]);
  };

  const handleEdit = (regra: Regra) => {
    setEditingId(regra.id);
    setFormData({
      nome: regra.nome,
      tipo: regra.tipo,
      ativo: regra.ativo,
      empresa_id: regra.empresa_id || "",
      administradora_id: regra.administradora_id || "",
      grupo_filtro: regra.grupo_filtro || ""
    });
    setFaixas(
      (regra.faixas_comissao || [])
        .sort((a, b) => a.ordem - b.ordem)
        .map(f => ({
          id: f.id,
          ordem: f.ordem,
          percentual: f.percentual,
          parcelas: f.parcelas,
          meses_carencia: f.meses_carencia || 0
        }))
    );
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta regra?")) return;
    const { error } = await supabase.from("regras_comissao").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Regra excluída");
    fetchData();
  };

  const addFaixa = () => {
    setFaixas([...faixas, { ordem: faixas.length + 1, percentual: 2, parcelas: 10, meses_carencia: 0 }]);
  };

  const removeFaixa = (index: number) => {
    if (faixas.length === 1) return;
    setFaixas(faixas.filter((_, i) => i !== index));
  };

  const updateFaixa = (index: number, field: keyof Faixa, value: number) => {
    const updated = [...faixas];
    updated[index] = { ...updated[index], [field]: value };
    setFaixas(updated);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const formatFaixas = (regra: Regra) => {
    const faixasList = regra.faixas_comissao || [];
    if (faixasList.length === 0) return "-";
    return faixasList
      .sort((a, b) => a.ordem - b.ordem)
      .map(f => `${f.percentual}% em ${f.parcelas}x`)
      .join(" + ");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Regras de Comissão</h1>
            <p className="text-muted-foreground">Configure as regras de comissão com múltiplas faixas e defasagem</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Regra de Comissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Regra *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Comissão Padrão Vendedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                      <SelectItem value="REPRESENTANTE">Representante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={formData.empresa_id} onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Administradora</Label>
                  <Select value={formData.administradora_id} onValueChange={(v) => setFormData({ ...formData, administradora_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {administradoras.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grupo (opcional)</Label>
                  <Input
                    value={formData.grupo_filtro}
                    onChange={(e) => setFormData({ ...formData, grupo_filtro: e.target.value })}
                    placeholder="Ex: 1234"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(v) => setFormData({ ...formData, ativo: v })}
                />
                <Label>Regra ativa</Label>
              </div>

              {/* Faixas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      <CardTitle className="text-lg">Faixas de Comissão</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={addFaixa}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Faixa
                    </Button>
                  </div>
                  <CardDescription>
                    Configure múltiplas faixas (ex: 3% em 10x + 2% em 10x)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faixas.map((faixa, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Percentual (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={faixa.percentual}
                          onChange={(e) => updateFaixa(index, 'percentual', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Parcelas</Label>
                        <Input
                          type="number"
                          value={faixa.parcelas}
                          onChange={(e) => updateFaixa(index, 'parcelas', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Carência (meses)</Label>
                        <Input
                          type="number"
                          value={faixa.meses_carencia}
                          onChange={(e) => updateFaixa(index, 'meses_carencia', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFaixa(index)}
                        disabled={faixas.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : regras.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma regra configurada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Faixas</TableHead>
                  <TableHead>Administradora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((regra) => (
                  <TableRow key={regra.id}>
                    <TableCell className="font-medium">{regra.nome}</TableCell>
                    <TableCell>
                      <Badge variant={regra.tipo === 'VENDEDOR' ? 'default' : 'secondary'}>
                        {regra.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatFaixas(regra)}</TableCell>
                    <TableCell>{regra.administradoras?.nome || "Todas"}</TableCell>
                    <TableCell>
                      <Badge variant={regra.ativo ? 'default' : 'outline'}>
                        {regra.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(regra)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(regra.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
