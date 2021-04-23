import vytools, os

thisfolder = os.path.dirname(os.path.realpath(__file__))
vytools.scan(contextpaths=[thisfolder])
vytools.build(['stage:vybots-base'],build_level=1)
vytools.server(top_level="ui:vybots/vybot.html", hide_log=True)
