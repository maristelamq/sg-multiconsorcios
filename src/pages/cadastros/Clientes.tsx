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
import { Plus, Pencil, Trash2, User } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  contato: string | null;
  empresa_id: string | null;
  empresas?: { nome: string } | null;
}

interface Empresa {
  id: string;
  nome: string;
}

export default function Clientes() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    nome: "", 
    cpf_cnpj: "", 
    contato: "", 
    empresa_id: "" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, empRes] = await Promise.all([
      supabase.from("clientes").select("*, empresas(nome)").order("nome"),
      supabase.from("empresas").select("id, nome").order("nome")
    ]);
    
    if (itemsRes.error) {
      toast.error("Erro ao carregar clientes");
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
      cpf_cnpj: formData.cpf_cnpj || null,
      contato: formData.contato || null,
      empresa_id: formData.empresa_id || null
    };

    if (editingId) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Cliente atualizado");
    } else {
      const { error } = await supabase.from("clientes").insert(payload);
      if (error) {
        toast.error("Erro ao criar");
        return;
      }
      toast.success("Cliente criado");
    }

    setDialogOpen(false);
    setEditingId(null);
    setFormData({ nome: "", cpf_cnpj: "", contato: "", empresa_id: "" });
    fetchData();
  };

  const handleEdit = (item: Cliente) => {
    setEditingId(item.id);
    setFormData({ 
      nome: item.nome, 
      cpf_cnpj: item.cpf_cnpj || "",
      contato: item.contato || "",
      empresa_id: item.empresa_id || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Cliente excluído");
    fetchData();
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ nome: "", cpf_cnpj: "", contato: "", empresa_id: "" });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    placeholder="CPF ou CNPJ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    placeholder="Telefone ou email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={formData.empresa_id} onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.cpf_cnpj || "-"}</TableCell>
                    <TableCell>{item.contato || "-"}</TableCell>
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
