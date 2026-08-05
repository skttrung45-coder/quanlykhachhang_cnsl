import os
import json

def generate_input_list():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(base_dir, 'input')
    file_list = []
    
    if os.path.exists(input_dir):
        for root, dirs, files in os.walk(input_dir):
            for file in files:
                if file.endswith(('.xlsb', '.xlsx', '.xls')):
                    rel_dir = os.path.relpath(root, input_dir)
                    if rel_dir == '.':
                        rel_path = file
                    else:
                        rel_path = os.path.join(rel_dir, file).replace('\\', '/')
                    file_list.append(rel_path)
                    
        file_list.sort()
        
        list_json_path = os.path.join(input_dir, 'list.json')
        with open(list_json_path, 'w', encoding='utf-8') as f:
            json.dump(file_list, f, indent=2, ensure_ascii=False)
            
        print(f"Da cap nhat input/list.json voi {len(file_list)} file Excel.")
    else:
        print("Thu muc input khong ton tai.")

if __name__ == '__main__':
    generate_input_list()
