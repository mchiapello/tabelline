from flask import Flask, render_template, request, jsonify
from database import init_db, salva_verifica, get_statistiche_generali, get_dettaglio_verifica

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/salva-verifica", methods=["POST"])
def api_salva_verifica():
    data = request.get_json()
    verifica_id = salva_verifica(
        modalita=data.get("modalita", "verifica"),
        totale_domande=data["totale_domande"],
        risposte_corrette=data["risposte_corrette"],
        tempo_totale=data.get("tempo_totale"),
        timer_per_domanda=data.get("timer_per_domanda"),
        risposte=data["risposte"]
    )
    return jsonify({"ok": True, "verifica_id": verifica_id})


@app.route("/api/statistiche")
def api_statistiche():
    return jsonify(get_statistiche_generali())


@app.route("/api/verifica/<int:verifica_id>")
def api_dettaglio_verifica(verifica_id):
    return jsonify(get_dettaglio_verifica(verifica_id))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
