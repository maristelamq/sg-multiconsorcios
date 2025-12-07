import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";

interface Cota {
  id: string;
  codigo: string;
  grupo: string;
  tipo: string;
  status: string | null;
  empresa_id: string | null;
  administradora_id: string | null;
  empresas?: { nome: string } | null;
  administradoras?: { nome: string } | null;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Administradora {
  id: string;
  nome: string;
}

export default function Cotas() {
  const [items, setItems] = useState<Cota[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [administradoras, setAdministradoras] = useState<Administradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    codigo: "", 
    grupo: "", 
    tipo: "IMÓVEL", 
    status: "ATIVO",
    empresa_id: "",
    administradora_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, empRes, admRes] = await Promise.all([
      supabase.from("cotas").select("*, empresas(nome), administradoras(nome)").order("grupo").order("codigo"),
      supabase.from("empresas").select("id, nome").order("nome"),
      supabase.from("administradoras").select("id, nome").order("nome")
    ]);
    
    if (itemsRes.error) {
      toast.error("Erro ao carregar cotas");
      return;
    }
    setItems(itemsRes.data || []);
    setEmpresas(empRes.data || []);
    setAdministradoras(admRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.grupo.trim()) {
      toast.error("Código e Grupo são obrigatórios");
      return;
    }

    const payload = {
      codigo: formData.codigo,
      grupo: formData.grupo,
      tipo: formData.tipo,
      status: formData.status,
      empresa_id: formData.empresa_id || null,
      administradora_id: formData.administradora_id || null
    };

    if (editingId) {
      const { error } = await supabase.from("cotas").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Cota atualizada");
    } else {
      const { error } = await supabase.from("cotas").insert(payload);
      if (error) {
        toast.error("Erro ao criar");
        return;
      }
      toast.success("Cota criada");
    }

    setDialogOpen(false);
    setEditingId(null);
    setFormData({ codigo: "", grupo: "", tipo: "IMÓVEL", status: "ATIVO", empresa_id: "", administradora_id: "" });
    fetchData();
  };

  const handleEdit = (item: Cota) => {
    setEditingId(item.id);
    setFormData({ 
      codigo: item.codigo, 
      grupo: item.grupo,
      tipo: item.tipo,
      status: item.status || "ATIVO",
      empresa_id: item.empresa_id || "",
      administradora_id: item.administradora_id || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir?")) return;
    const { error } = await supabase.from("cotas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Cota excluída");
    fetchData();
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ codigo: "", grupo: "", tipo: "IMÓVEL", status: "ATIVO", empresa_id: "", administradora_id: "" });
    setDialogOpen(true);
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ATIVO: "default",
    CONTEMPLADO: "secondary",
    CANCELADO: "destructive",
    QUITADO: "outline"
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cotas</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Cota</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo *</Label>
                  <Input
                    id="grupo"
                    value={formData.grupo}
                    onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                    placeholder="Ex: 1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: 001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMÓVEL">Imóvel</SelectItem>
                      <SelectItem value="VEÍCULO">Veículo</SelectItem>
                      <SelectItem value="SERVIÇO">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="CONTEMPLADO">Contemplado</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      <SelectItem value="QUITADO">Quitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>Administradora</Label>
                  <Select value={formData.administradora_id} onValueChange={(v) => setFormData({ ...formData, administradora_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {administradoras.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <CardTitle>Lista de Cotas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma cota cadastrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Administradora</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.grupo}</TableCell>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[item.status || "ATIVO"] || "default"}>
                        {item.status || "ATIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.administradoras?.nome || "-"}</TableCell>
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
