
import docx
import sys

def save_text(docx_path, out_path):
    try:
        doc = docx.Document(docx_path)
        with open(out_path, 'w', encoding='utf-8') as f:
            for para in doc.paragraphs:
                f.write(para.text + '\n')
        print(f"Successfully saved to {out_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    save_text('srs_mvp.docx', 'scratch/srs_initial.txt')
