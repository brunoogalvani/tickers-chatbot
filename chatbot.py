import os

def processar_resposta(resposta,nome):
    if resposta =="1":
        print(f'{os.linesep}{nome}a{os.linesep}')
    elif resposta =="2":
        print(f'{os.linesep}{nome}b{os.linesep}')
    elif resposta =="3":
        print(f'{os.linesep}{nome}c{os.linesep}')
    elif resposta =="4":
        print(f'{os.linesep}{nome}d{os.linesep}')
def start():
    print('Bem vindo ao Tickers!')
    nome = input('Digite seu nome: ')
    email = input('Digite seu e-mail: ')
    while True:
            resposta = input
            (f'O que gostaria de saber hoje?{os.linesep}[1] - Quer saber quais são os eventos mais próximos?{os.linesep}[2] - Quer saber os eventos dos seus gostos que estão rolando?{os.linesep}[3] - Quer saber quais artistas estão na área?{os.linesep}[4] - Quer dar um feedback?{os.linesep}')
            processar_resposta(resposta, nome)

if __name__ == '__main__':
    start()