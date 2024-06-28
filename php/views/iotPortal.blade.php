<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/tr/html4/strict.dtd">
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
  <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;700&display=swap" rel="stylesheet">
    <link href="{{URL::to('css/app.css')}}?<?php echo time();?>" rel="stylesheet">
    <title>Mighty Link</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
  </head>
  <body style=' min-height:100vh;display:flex'>
    <div style="display:flex;align-content:center;width:100vw" id="appContent"></div>
    <script type="text/javascript" src="{{URL::to('js/app.js')}}?<?php echo time();?>"></script>
  </body>
</html>
