#!/usr/bin/env python3
"""Recalcula a política de segurança (CSP) dos arquivos .html desta pasta.
Rode SEMPRE depois de editar o código de um .html:   python3 atualizar-csp.py
(A CSP guarda a "impressão digital" de cada script e estilo; se o código mudar sem
atualizar, o navegador bloqueia o código e o app não funciona.)"""
import re, hashlib, base64, pathlib

def h(texto):
    d = hashlib.sha256(texto.replace("\r\n", "\n").encode("utf-8")).digest()
    return "'sha256-" + base64.b64encode(d).decode() + "'"

for f in sorted(pathlib.Path(__file__).resolve().parent.glob("*.html")):
    s = f.read_bytes().decode("utf-8")
    scripts = " ".join(h(x) for x in re.findall(r"<script>(.*?)</script>", s, re.S))
    styles = " ".join(h(x) for x in re.findall(r"<style>(.*?)</style>", s, re.S))
    csp = ("default-src 'none'; script-src %s; style-src %s; img-src 'self'; manifest-src 'self'; "
           "connect-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; "
           "object-src 'none'; frame-src 'none'") % (scripts, styles)
    novo, n = re.subn(r'(<meta http-equiv="Content-Security-Policy" content=")[^"]*(">)',
                      lambda m: m.group(1) + csp + m.group(2), s)
    if n == 1:
        f.write_bytes(novo.encode("utf-8"))
        print("CSP atualizada:", f.name)
    else:
        print("AVISO: meta CSP não encontrada em", f.name)
