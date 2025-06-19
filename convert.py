import csv

with open('input.csv', 'r', encoding='utf-8') as f, open('output.csv', 'w', encoding='utf-8', newline='') as o:
    reader = csv.reader(f)
    writer = csv.writer(o)
    header = next(reader)
    writer.writerow(['item_id', '', '', 'category'])
    for row in reader:
        item_id = row[0]
        category = row[-1]
        writer.writerow([item_id, '', '', category])
