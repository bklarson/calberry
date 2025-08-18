    let sources = [];

    function renderSources() {
      const tbody = document.querySelector('#sources-table tbody');
      tbody.innerHTML = '';

      sources.forEach((source, index) => {
        const tr = document.createElement('tr');
        if (source.deleted) tr.classList.add('deleted');

        tr.innerHTML = `
          <td><input type="text" value="${source.name}" onchange="sources[${index}].name = this.value"></td>
          <td><input type="text" value="${source.url}" onchange="sources[${index}].url = this.value"></td>
          <td>
            <div class="color-dot" style="background: ${source.color}" onclick="document.getElementById('color-${index}').click()"></div>
            <input type="color" id="color-${index}" class="color-picker" value="${source.color}" onchange="changeColor(${index}, this.value)">
          </td>
          <td><input type="checkbox" ${source.enabled ? 'checked' : ''} onchange="sources[${index}].enabled = this.checked"></td>
          <td>
            <button onclick="markDeleted(${index})">${source.deleted ? 'Undo' : '🗑️'}</button>
          </td>
        `;

        tbody.appendChild(tr);
      });
    }

    function changeColor(index, color) {
      sources[index].color = color;
      renderSources();
    }

    function markDeleted(index) {
      sources[index].deleted = !sources[index].deleted;
      renderSources();
    }

    function saveSources(successCallback) {
      const toSave = sources.filter(src => !src.deleted);
      fetch('/api/calendar/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave)
      })
      .then(res => res.ok ? successCallback() : alert('Failed to save'))
      .catch(() => alert('Failed to save'));
    }

    function addSource() {
      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      sources.push({
        name: '',
        url: '',
        color: randomColor,
        enabled: true
      });
      renderSources();
    }

    function loadSources() {
      fetch('/api/calendar/sources')
      .then(res => res.json())
      .then(data => {
        sources = data;
        if (sources.length === 0) {
          addSource();
        } else {
          renderSources();
        }
      });
    }