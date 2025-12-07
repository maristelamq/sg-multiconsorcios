import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";

interface Vendedor {
  id: string;
  nome: string;
  cpf: string | null;
  exige_nf: boolean | null;
  empresa_id: string | null;
  representante_id: string | null;
  empresas?: { nome: string } | null;
  representantes?: { nome: string } | null;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Representante {
  id: string;
  nome: string;
}

export default function Vendedores() {
  const [items, setItems] = useState<Vendedor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    nome: "", 
    cpf: "", 
    exige_nf: true, 
    empresa_id: "",
    representante_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, empRes, repRes] = await Promise.all([
      supabase.from("vendedores").select("*, empresas(nome), representantes(nome)").order("nome"),
      supabase.from("empresas").select("id, nome").order("nome"),
      supabase.from("representantes").select("id, nome").order("nome")
    ]);
    
    if (itemsRes.error) {
      toast.error("Erro ao carregar vendedores");
      return;
    }
    setItems(itemsRes.data || []);
    setEmpresas(empRes.data || []);
    setRepresentantes(repRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload = {
      nome: formData.nome,
      cpf: formData.cpf || null,
      exige_nf: formData.exige_nf,
      empresa_id: formData.empresa_id || null,
      representante_id: formData.representante_id || null
    };

    if (editingId) {
      const { error } = await supabase.from("vendedores").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Vendedor atualizado");
    } else {
      const { error } = await supabase.from("vendedores").insert(payload);
      if (error) {
        toast.error("Erro ao criar");
        return;
      }
      toast.success("Vendedor criado");
    }

    setDialogOpen(false);
    setEditingId(null);
    setFormData({ nome: "", cpf: "", exige_nf: true, empresa_id: "", representante_id: "" });
    fetchData();
  };

  const handleEdit = (item: Vendedor) => {
    setEditingId(item.id);
    setFormData({ 
      nome: item.nome, 
      cpf: item.cpf || "",
      exige_nf: item.exige_nf ?? true,
      empresa_id: item.empresa_id || "",
      representante_id: item.representante_id || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await supabase.from("vendedores").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Vendedor excluído");
    fetchData();
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ nome: "", cpf: "", exige_nf: true, empresa_id: "", representante_id: "" });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Vendedores</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Vendedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do vendedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Representante</Label>
                  <Select value={formData.representante_id} onValueChange={(v) => setFormData({ ...formData, representante_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {representantes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.exige_nf}
                  onCheckedChange={(v) => setFormData({ ...formData, exige_nf: v })}
                />
                <Label>Exige Nota Fiscal</Label>
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
          <CardTitle>Lista de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum vendedor cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Representante</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.cpf || "-"}</TableCell>
                    <TableCell>{item.empresas?.nome || "-"}</TableCell>
                    <TableCell>{item.representantes?.nome || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.exige_nf ? "default" : "secondary"}>
                        {item.exige_nf ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
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
