import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Empresa {
  id: string;
  nome: string;
}

interface Cota {
  id: string;
  codigo: string;
  grupo: string;
  tipo: string;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Vendedor {
  id: string;
  nome: string;
  representante_id: string | null;
}

interface Representante {
  id: string;
  nome: string;
}

export default function NovaVenda() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cotas, setCotas] = useState<Cota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);

  const [formData, setFormData] = useState({
    empresa_id: "",
    cota_id: "",
    cliente_id: "",
    vendedor_id: "",
    representante_id: "",
    data_venda: format(new Date(), "yyyy-MM-dd"),
    valor_credito: "",
    valor_total: "",
    observacao: "",
  });

  useEffect(() => {
    fetchEmpresas();
    fetchClientes();
    fetchRepresentantes();
  }, []);

  useEffect(() => {
    if (formData.empresa_id) {
      fetchCotas(formData.empresa_id);
      fetchVendedores(formData.empresa_id);
    }
  }, [formData.empresa_id]);

  useEffect(() => {
    // Quando seleciona vendedor, preenche automaticamente o representante
    const vendedor = vendedores.find(v => v.id === formData.vendedor_id);
    if (vendedor?.representante_id) {
      setFormData(prev => ({ ...prev, representante_id: vendedor.representante_id || "" }));
    }
  }, [formData.vendedor_id, vendedores]);

  async function fetchEmpresas() {
    const { data } = await supabase.from("empresas").select("id, nome").order("nome");
    setEmpresas(data || []);
  }

  async function fetchCotas(empresaId: string) {
    const { data } = await supabase
      .from("cotas")
      .select("id, codigo, grupo, tipo")
      .eq("empresa_id", empresaId)
      .eq("status", "ATIVO")
      .order("codigo");
    setCotas(data || []);
  }

  async function fetchClientes() {
    const { data } = await supabase.from("clientes").select("id, nome").order("nome");
    setClientes(data || []);
  }

  async function fetchVendedores(empresaId: string) {
    const { data } = await supabase
      .from("vendedores")
      .select("id, nome, representante_id")
      .eq("empresa_id", empresaId)
      .order("nome");
    setVendedores(data || []);
  }

  async function fetchRepresentantes() {
    const { data } = await supabase.from("representantes").select("id, nome").order("nome");
    setRepresentantes(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.empresa_id || !formData.cota_id || !formData.cliente_id || !formData.valor_credito) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: venda, error } = await supabase
        .from("vendas")
        .insert({
          empresa_id: formData.empresa_id,
          cota_id: formData.cota_id,
          cliente_id: formData.cliente_id,
          vendedor_id: formData.vendedor_id || null,
          representante_id: formData.representante_id || null,
          data_venda: formData.data_venda,
          valor_credito: parseFloat(formData.valor_credito.replace(/\D/g, "")) / 100,
          valor_total: formData.valor_total ? parseFloat(formData.valor_total.replace(/\D/g, "")) / 100 : parseFloat(formData.valor_credito.replace(/\D/g, "")) / 100,
          observacao: formData.observacao || null,
          situacao: "ATIVO",
          docs_status: "PENDENTE",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Venda criada com sucesso!");
      navigate(`/vendas/${venda.id}?tab=documentos`);
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast.error("Erro ao criar venda");
    }
    setLoading(false);
  }

  const handleCurrencyInput = (field: "valor_credito" | "valor_total", value: string) => {
    // Remove tudo que não for número
    const numericValue = value.replace(/\D/g, "");
    
    // Formata como moeda
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseInt(numericValue || "0") / 100);

    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendas")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Venda</h1>
          <p className="text-muted-foreground">Cadastre uma nova venda no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados da Empresa e Cota */}
          <Card>
            <CardHeader>
              <CardTitle>Empresa e Cota</CardTitle>
              <CardDescription>Selecione a empresa e a cota da venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Empresa *</Label>
                <Select
                  value={formData.empresa_id}
                  onValueChange={(v) => setFormData({ ...formData, empresa_id: v, cota_id: "", vendedor_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cota *</Label>
                <Select
                  value={formData.cota_id}
                  onValueChange={(v) => setFormData({ ...formData, cota_id: v })}
                  disabled={!formData.empresa_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cota" />
                  </SelectTrigger>
                  <SelectContent>
                    {cotas.map((cota) => (
                      <SelectItem key={cota.id} value={cota.id}>
                        {cota.codigo} - {cota.grupo} ({cota.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data da Venda *</Label>
                <Input
                  type="date"
                  value={formData.data_venda}
                  onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
              <CardDescription>Selecione ou cadastre o cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vendedor e Representante */}
          <Card>
            <CardHeader>
              <CardTitle>Vendedor e Representante</CardTitle>
              <CardDescription>Informe o vendedor responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Vendedor</Label>
                <Select
                  value={formData.vendedor_id}
                  onValueChange={(v) => setFormData({ ...formData, vendedor_id: v })}
                  disabled={!formData.empresa_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>{vendedor.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Representante</Label>
                <Select
                  value={formData.representante_id}
                  onValueChange={(v) => setFormData({ ...formData, representante_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o representante" />
                  </SelectTrigger>
                  <SelectContent>
                    {representantes.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>{rep.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
              <CardDescription>Informe os valores da venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valor do Crédito *</Label>
                <Input
                  value={formData.valor_credito}
                  onChange={(e) => handleCurrencyInput("valor_credito", e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <Label>Valor Total</Label>
                <Input
                  value={formData.valor_total}
                  onChange={(e) => handleCurrencyInput("valor_total", e.target.value)}
                  placeholder="R$ 0,00 (mesmo que crédito se vazio)"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Observações adicionais sobre a venda..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/vendas")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar e Adicionar Documentos
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
