import sqlite3
import pandas as pd
from datetime import datetime
import re
import os

# ====================== CONFIGURAÇÃO DE CAMINHOS ======================
# O arquivo excel está em C:\Pedidos\backend-pedidos\src\assets\BASE.xlsx
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, 'src', 'assets', 'BASE.xlsx')
DB_PATH = os.path.join(BASE_DIR, 'notas.db')

# ====================== CRIAÇÃO DA BASE ======================
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute('''
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_ano             TEXT,           -- ex: "MARÇO 2014"
    data_pedido         DATE,
    data_entrega        DATE,
    data_fatura         DATE,
    cliente             TEXT,
    produto             TEXT,
    pedido              TEXT,
    oc_cliente          TEXT,
    quantidade          REAL,
    unidade             TEXT,           -- MIL, KG, UND, etc.
    preco_unitario      REAL,
    valor_total         REAL,
    comissao            REAL,
    nf                  TEXT,
    saldo               REAL,
    observacao          TEXT,
    origem              TEXT,           -- "Principal" ou "Lateral Direita" (quando houver duas colunas)
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

conn.commit()
print(f"Banco {DB_PATH} preparado com sucesso!")

# ====================== FUNÇÃO DE CARGA ======================
def carregar_planilha(arquivo_excel):
    if not os.path.exists(arquivo_excel):
        print(f"❌ Erro: Arquivo {arquivo_excel} não encontrado!")
        return

    print(f"⏳ Lendo planilha: {arquivo_excel}...")
    # Lê todas as linhas como texto (melhor para planilhas bagunçadas)
    df = pd.read_excel(arquivo_excel, sheet_name='2014 - 2015', header=None, dtype=str)
    
    dados = []
    mes_atual = None
    
    for i, row in df.iterrows():
        # Filtra valores nulos para evitar erro no join
        linha = ' | '.join(row.fillna('').astype(str)).strip()
        
        # Detecta mês/ano
        match_mes = re.search(r'(JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+\d{4}', linha, re.IGNORECASE)
        if match_mes:
            mes_atual = match_mes.group(0)
            continue
        
        # Detecta linha de cliente + produto (padrão principal)
        # Lista de clientes fornecida no script original
        clientes_alvo = ['DOCE MEL', 'CALIMAN', 'CASA SUIÇA', 'FRUT MEL', 'NORTEFRUT', 'AGC', 'BENASSI', 'KORIN', 'HORTA VITAE']
        if any(x in linha.upper() for x in clientes_alvo):
            partes = [p.strip() for p in linha.split('|') if p.strip()] # Usando o separador que criamos acima
            
            # Nota: O splitter original usava ',', mas a linha foi montada com ' | '
            # Vamos tentar uma abordagem mais robusta baseada na lista de colunas se possível, 
            # mas manteremos a lógica do usuário o máximo possível.
            
            if len(partes) >= 8:
                try:
                    registro = {
                        'mes_ano': mes_atual,
                        'cliente': partes[0],
                        'produto': partes[1],
                        'pedido': partes[2] if len(partes) > 2 else None,
                        'oc_cliente': partes[3] if len(partes) > 3 else None,
                        'data_pedido': partes[4] if len(partes) > 4 and re.search(r'\d{2}/\d{2}/\d{4}', partes[4]) else None,
                        'quantidade': float(re.sub(r'[^0-9.]', '', partes[5])) if len(partes) > 5 else None,
                        'unidade': partes[6] if len(partes) > 6 else None,
                        'preco_unitario': float(re.sub(r'[^0-9.]', '', partes[7])) if len(partes) > 7 else None,
                        'valor_total': None,
                        'comissao': None,
                        'nf': None,
                        'saldo': None,
                        'observacao': None,
                        'origem': 'Principal'
                    }
                    
                    # Tenta capturar mais campos (data entrega, NF, valor, comissão)
                    for p in partes:
                        if re.search(r'\d{2}/\d{2}/\d{4}', p):
                            if not registro['data_entrega']:
                                registro['data_entrega'] = p
                        if 'NF' in p.upper() or re.search(r'^\d{4,}$', p):
                            registro['nf'] = p
                        if re.search(r'R?\$\s?[\d.,]+', p):
                            valor_str = re.sub(r'[^0-9.,]', '', p)
                            valor_str = valor_str.replace(',', '.')
                            try:
                                registro['valor_total'] = float(valor_str)
                            except:
                                pass
                    
                    if registro['preco_unitario'] and registro['quantidade']:
                        registro['valor_total'] = registro['preco_unitario'] * registro['quantidade']
                    
                    dados.append(registro)
                except Exception as e:
                    # print(f"Erro na linha {i}: {e}")
                    continue
    
    # Insere no banco
    for reg in dados:
        try:
            cur.execute('''
                INSERT INTO notas_fiscais 
                (mes_ano, data_pedido, data_entrega, data_fatura, cliente, produto, pedido, 
                 oc_cliente, quantidade, unidade, preco_unitario, valor_total, comissao, 
                 nf, saldo, observacao, origem)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                reg['mes_ano'], reg.get('data_pedido'), reg.get('data_entrega'), None,
                reg['cliente'], reg['produto'], reg.get('pedido'), reg.get('oc_cliente'),
                reg.get('quantidade'), reg.get('unidade'), reg.get('preco_unitario'),
                reg.get('valor_total'), reg.get('comissao'), reg.get('nf'),
                reg.get('saldo'), reg.get('observacao'), reg.get('origem')
            ))
        except Exception as e:
            print(f"Erro ao inserir registro: {e}")
    
    conn.commit()
    print(f"✅ {len(dados)} registros carregados com sucesso no banco!")

# ====================== EXECUÇÃO ======================
if __name__ == "__main__":
    carregar_planilha(EXCEL_PATH)
    conn.close()
