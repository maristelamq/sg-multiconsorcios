import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface Representante {
  id: string;
  nome: string;
  tipo: string | null;
  percentual: number | null;
  parcelas: number | null;
  empresa_id: string | null;
  empresas?: { nome: string } | null;
}

interface Empresa {
  id: string;
  nome: string;
}

export default function Representantes() {
  const [items, setItems] = useState<Representante[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    nome: "", 
    tipo: "INTERNO", 
    percentual: "0", 
    parcelas: "1", 
    empresa_id: "" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, empRes] = await Promise.all([
      supabase.from("representantes").select("*, empresas(nome)").order("nome"),
      supabase.from("empresas").select("id, nome").order("nome")
    ]);
    
    if (itemsRes.error) {
      toast.error("Erro ao carregar representantes");
      return;
    }
    setItems(itemsRes.data || []);
    setEmpresas(empRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      percentual: parseFloat(formData.percentual) || 0,
      parcelas: parseInt(formData.parcelas) || 1,
      empresa_id: formData.empresa_id || null
    };

    if (editingId) {
      const { error } = await supabase.from("representantes").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Representante atualizado");
    } else {
      const { error } = await supabase.from("representantes").insert(payload);
      if (error) {
        toast.error("Erro ao criar");
        return;
      }
      toast.success("Representante criado");
    }

    setDialogOpen(false);
    setEditingId(null);
    setFormData({ nome: "", tipo: "INTERNO", percentual: "0", parcelas: "1", empresa_id: "" });
    fetchData();
  };

  const handleEdit = (item: Representante) => {
    setEditingId(item.id);
    setFormData({ 
      nome: item.nome, 
      tipo: item.tipo || "INTERNO",
      percentual: String(item.percentual || 0),
      parcelas: String(item.parcelas || 1),
      empresa_id: item.empresa_id || "" 
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await supabase.from("representantes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Representante excluído");
    fetchData();
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ nome: "", tipo: "INTERNO", percentual: "0", parcelas: "1", empresa_id: "" });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Representantes</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Representante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Representante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do representante"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNO">Interno</SelectItem>
                      <SelectItem value="EXTERNO">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={formData.empresa_id} onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percentual">Percentual (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    step="0.01"
                    value={formData.percentual}
                    onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcelas">Parcelas</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    value={formData.parcelas}
                    onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                  />
                </div>
              </div>
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
          <CardTitle>Lista de Representantes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum representante cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.tipo || "-"}</TableCell>
                    <TableCell>{item.percentual}%</TableCell>
                    <TableCell>{item.parcelas}x</TableCell>
                    <TableCell>{item.empresas?.nome || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
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
