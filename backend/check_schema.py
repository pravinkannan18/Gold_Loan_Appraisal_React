from models.database import Database

db = Database()
cursor = db.get_connection().cursor()
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'banks' ORDER BY ordinal_position")
banks_columns = [row[0] for row in cursor.fetchall()]
print("Banks table columns:", banks_columns)

cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'branches' ORDER BY ordinal_position")
branches_columns = [row[0] for row in cursor.fetchall()]
print("Branches table columns:", branches_columns)

cursor.close()
db.close()