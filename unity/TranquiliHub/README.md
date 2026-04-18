# TranquiliHub Unity Scaffold

Este scaffold cobre a parte de deep link e hidratacao de sessao da Fase 1.

## O que ja esta pronto

- Scripts C# para ler `tranquiliways://session/{id}?token={launchToken}`
- Bootstrap para buscar `GET /api/sessions/{id}?token=...`
- Manifest Android de exemplo para a Unity receber o deep link
- Estrutura inicial para uma cena `TranquiliHub`

## O que ainda precisa ser feito no Editor Unity 6

1. Abrir esta pasta em uma instalacao local do Unity 6.x.
2. Criar a cena `Assets/Scenes/TranquiliHub.unity`.
3. Adicionar um GameObject vazio chamado `TranquiliHubBootstrap`.
4. Anexar o script `TranquiliHubBootstrap.cs`.
5. Configurar `Api Base Url` apontando para o host do app React/Capacitor.
6. Montar o hub visual com:
   - ceu suave
   - nevoa leve
   - caminhos de luz
   - particulas de chama
   - animacoes calmas em loop

## Pacote Android recomendado

- App React/Capacitor: `com.tranquiliways.app`
- App Unity Hub: `com.tranquiliways.hub`

## Deep link esperado

```text
tranquiliways://session/{id}?token={launchToken}
```

O app React/Capacitor deve disparar essa URL. O app Unity deve ser o receptor dessa scheme na Fase 1.
