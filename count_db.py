import sqlite3
conn = sqlite3.connect('notas.db')
c = conn.cursor()
for t in ['orders', 'orderItems', 'suppliers', 'customers']:
    count = c.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"{t}: {count}")
conn.close()
