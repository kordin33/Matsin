(function(){
  // Ustal backend (WebSocket+REST) – domena serwera API
  var BACKEND = 'https://websocket-production-e339.up.railway.app';

  var qs = function(s){ return document.querySelector(s); };
  var statusEl = qs('#status');
  var tableBody = qs('#teachersTable');
  var tokenInput = qs('#adminToken');

  function setStatus(msg, type){
    statusEl.className = type === 'error' ? 'error' : 'success';
    statusEl.textContent = msg;
  }

  function teacherLink(teacher_id, token){
    var appOrigin = window.location.origin;
    return appOrigin + '/?teacher=' + encodeURIComponent(teacher_id) + '&t=' + encodeURIComponent(token);
  }

  function renderTeachers(items){
    tableBody.innerHTML = '';
    (items||[]).forEach(function(t){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+(t.name||'')+'</td>'+
                     '<td>'+(t.email||'')+'</td>'+
                     '<td class="token">'+t.teacher_id+'</td>'+
                     '<td class="token">'+t.token+'</td>'+
                     '<td><a target="_blank" href="'+teacherLink(t.teacher_id, t.token)+'">Otwórz panel nauczyciela</a></td>';
      tableBody.appendChild(tr);
    });
  }

  async function adminFetch(path, opts){
    var headers = Object.assign({'Content-Type':'application/json'}, (opts && opts.headers)||{});
    var token = (tokenInput.value||'').trim();
    if(!token){ throw new Error('Wprowadź token administratora'); }
    headers['x-admin-token'] = token;
    var resp = await fetch(BACKEND + path, Object.assign({}, opts||{}, { headers: headers }));
    if(!resp.ok){ throw new Error('HTTP '+resp.status+': '+ (await resp.text())); }
    return resp.json();
  }

  var loadBtn = qs('#loadTeachers');
  if(loadBtn){
    loadBtn.addEventListener('click', async function(){
      try{
        var json = await adminFetch('/api/admin/teachers');
        renderTeachers(json.items||[]);
        setStatus('Załadowano listę nauczycieli','ok');
      }catch(e){ setStatus(e.message,'error'); }
    });
  }

  var uploadBtn = qs('#uploadCsv');
  if(uploadBtn){
    uploadBtn.addEventListener('click', async function(){
      try{
        var csv = (qs('#csvText').value||'').trim();
        if(!csv){
          var file = (qs('#csvFile').files||[])[0];
          if(!file){ throw new Error('Wybierz plik CSV lub wklej dane'); }
          csv = await file.text();
        }
        var json = await adminFetch('/api/admin/teachers/upload', { method:'POST', body: JSON.stringify({csv: csv}) });
        var list = await adminFetch('/api/admin/teachers');
        renderTeachers(list.items||[]);
        setStatus('Wgrano '+(json.items?json.items.length:0)+' nauczycieli','ok');
      }catch(e){ setStatus(e.message,'error'); }
    });
  }
})();
