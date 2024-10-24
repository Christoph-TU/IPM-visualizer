import json
import os

def parse_file_to_json(filepath):
    data = {}
    with open(filepath, 'r') as file:
        for line in file:
            line = line.strip()
            if line and line[0].isdigit() and '|' in line:
                parts = line.split('|')
                if len(parts) > 4:  # Ensure there are enough parts
                    # Extracting function name from the function declaration
                    function_declaration = parts[2].strip()
                    function_name = function_declaration.split('(')[0].split()[-1].strip()
                    
                    # Splitting args on commas and stripping spaces to create a set of args
                    args_set = list(arg.strip() for arg in parts[-1].split(','))
                    
                    # Using function name as key
                    data[function_name] = args_set

    return data

def save_data_to_file(data, filename):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=4)


def main():
    script_dir = os.path.dirname(__file__)
    input_filename = 'ipm_key_mpi.txt'  # Name of the key file
    output_filename = 'ipm_key_mpi.json'  # Name of the output file
    
    input_filepath = os.path.join(script_dir, input_filename)
    output_filepath = os.path.join(script_dir, output_filename)
    
    data = parse_file_to_json(input_filepath)
    save_data_to_file(data, output_filepath)

if __name__ == "__main__":
    main()
