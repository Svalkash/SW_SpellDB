from flask import Flask, request, jsonify, render_template, make_response
import json

app = Flask(__name__)

spells = []

# tf = open('spells_part.csv', 'r', encoding='utf-8')
# print(tf.read())
# tf.close()
with open('save.json', 'r') as f_init:
    spells = json.load(f_init)
print(spells)


@app.route("/api/spelldb", methods=['POST', 'GET'])
def spelldb():
    if request.method == 'POST':
        print(request.form)
        spells.append(request.form)
        # write to file, overwrite anything
        with open('save.json', 'w') as f:
            json.dump(spells, f, indent=4, ensure_ascii=False)
        # to do readable
        # json.dump(spells, f, indent=4, ensure_ascii=False)
        pre_resp = jsonify({'success': True})
    else:
        pre_resp = spells
    resp = make_response(pre_resp)
    resp.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:5500'
    return resp
