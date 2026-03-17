{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const Sovereign = \{\
    state: \{ feats: new Set(), items: new Set(), custom: [], skillStates: \{\}, subclass: "None" \},\
    stats: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],\
    skills: [\
        \{n:"Acrobatics", s:"DEX"\}, \{n:"Animal Handling", s:"WIS"\}, \{n:"Arcana", s:"INT"\}, \{n:"Athletics", s:"STR"\},\
        \{n:"Deception", s:"CHA"\}, \{n:"History", s:"INT"\}, \{n:"Insight", s:"WIS"\}, \{n:"Intimidation", s:"CHA"\},\
        \{n:"Investigation", s:"INT"\}, \{n:"Medicine", s:"WIS"\}, \{n:"Nature", s:"INT"\}, \{n:"Perception", s:"WIS"\},\
        \{n:"Performance", s:"CHA"\}, \{n:"Persuasion", s:"CHA"\}, \{n:"Religion", s:"INT"\}, \{n:"Sleight of Hand", s:"DEX"\},\
        \{n:"Stealth", s:"DEX"\}, \{n:"Survival", s:"WIS"\}\
    ],\
\
    async init() \{\
        // Safety loop for external 3MB library\
        if (typeof ClassList === 'undefined' || typeof RaceList === 'undefined') \{\
            setTimeout(() => this.init(), 200);\
            return;\
        \}\
\
        // Library loaded, remove overlay\
        document.getElementById('loading-overlay').style.display = 'none';\
\
        const pop = (id, list) => \{\
            const el = document.getElementById(id);\
            if (!el || !list) return;\
            Object.keys(list).sort().forEach(k => \{\
                const name = list[k].name || k;\
                if (!name.includes("(Subclass)")) el.add(new Option(name, k));\
            \});\
        \};\
\
        pop('in-race', RaceList); \
        pop('in-class', ClassList);\
        pop('sel-feat', FeatsList); \
        pop('sel-item', MagicItemsList);\
\
        this.stats.forEach(s => \{\
            document.getElementById('stat-inputs').innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;"><strong>$\{s\}</strong> <input type="number" class="st-in" data-s="$\{s\}" value="10" oninput="Sovereign.sync()" style="width:65px"></div>`;\
            document.getElementById('attr-display').innerHTML += `<div class="attr-card"><label>$\{s\}</label><b id="m-$\{s\}">+0</b><div class="attr-val" id="v-$\{s\}">10</div></div>`;\
        \});\
\
        const saved = Persistence.autoLoad();\
        if (saved) \{\
            this.state.feats = new Set(saved.feats);\
            this.state.items = new Set(saved.items);\
            this.state.custom = saved.custom || [];\
            this.state.skillStates = saved.skillStates || \{\};\
            this.applyUI(saved);\
        \}\
        this.updateSubclasses(saved ? saved.subclass : "None");\
    \},\
\
    updateSubclasses(savedSub = "None") \{\
        const clsKey = document.getElementById('in-class').value;\
        const subEl = document.getElementById('in-subclass');\
        subEl.innerHTML = '<option value="None">Select Subclass...</option>';\
        \
        const clsData = ClassList[clsKey];\
        if (clsData && clsData.subclasses) \{\
            const subs = clsData.subclasses[1]; \
            if (Array.isArray(subs)) \{\
                subs.forEach(s => subEl.add(new Option(s, s)));\
            \} else \{\
                Object.keys(clsData.subclasses).forEach(s => \{ if(s !== "active") subEl.add(new Option(s, s)); \});\
            \}\
            subEl.value = savedSub;\
            subEl.style.display = 'block';\
        \} else \{\
            subEl.style.display = 'none';\
        \}\
        this.sync();\
    \},\
\
    sync() \{\
        const lv = parseInt(document.getElementById('in-lv').value) || 1;\
        const prof = Math.floor((lv - 1) / 4) + 2;\
        const clsKey = document.getElementById('in-class').value;\
        const cls = ClassList[clsKey];\
        const race = RaceList[document.getElementById('in-race').value];\
        const sub = document.getElementById('in-subclass').value;\
        const mods = \{\};\
\
        this.stats.forEach((s, i) => \{\
            let v = parseInt(document.querySelector(`.st-in[data-s="$\{s\}"]`).value) || 10;\
            if(race?.scores && race.scores[i]) v += race.scores[i];\
            this.state.items.forEach(it => \{ if(MagicItemsList[it]?.scoreOverride?.[s]) v = Math.max(v, MagicItemsList[it].scoreOverride[s]); \});\
            mods[s] = Math.floor((v - 10) / 2);\
            document.getElementById(`v-$\{s\}`).innerText = v;\
            document.getElementById(`m-$\{s\}`).innerText = (mods[s] >= 0 ? "+" : "") + mods[s];\
        \});\
\
        const skUI = document.getElementById('s-skills-saves'); skUI.innerHTML = '';\
        this.stats.forEach(s => \{\
            const p = (cls?.saves && cls.saves.includes(s)) ? prof : 0;\
            skUI.innerHTML += `<div class="skill-row"><strong>$\{s\} Save</strong><b>$\{(mods[s]+p)>=0?'+':''\}$\{mods[s]+p\}</b></div>`;\
        \});\
        skUI.innerHTML += '<hr style="border:0; border-top:1px solid #eee; margin:10px 0;">';\
        \
        this.skills.forEach(sk => \{\
            let m = this.state.skillStates[sk.n] || 0;\
            if(clsKey === "bard" && lv >= 2 && m === 0) m = 0.5; \
            const b = Math.floor(m * prof);\
            const dotClass = m === 2 ? 'exp' : (m === 1 ? 'prof' : (m === 0.5 ? 'half' : ''));\
            skUI.innerHTML += `<div class="skill-row"><span class="dot $\{dotClass\}" onclick="Sovereign.toggleSkill('$\{sk.n\}')"></span> $\{sk.n\} <b>$\{(mods[sk.s]+b)>=0?'+':''\}$\{mods[sk.s] + b\}</b></div>`;\
        \});\
\
        this.renderResources(cls, lv, mods, prof, sub);\
        document.getElementById('s-init').innerText = (mods.DEX >= 0 ? "+" : "") + mods.DEX;\
        document.getElementById('s-hp').innerText = (cls?.hd || 8) + mods.CON + (lv-1)*(Math.floor((cls?.hd||8)/2)+1+mods.CON);\
\
        let tr = ""; \
        if(clsKey === "rogue" && lv >= 11) tr += "\'95 Reliable Talent (Min 10 on Proficient Skills)\\n";\
        this.state.custom.forEach(c => tr += `\'95 $\{c.n\}\\n`);\
        this.state.items.forEach(i => tr += `\'95 $\{MagicItemsList[i]?.name || i\}\\n`);\
        this.state.feats.forEach(f => tr += `\'95 $\{FeatsList[f]?.name || f\}\\n`);\
        document.getElementById('s-traits').innerText = tr;\
\
        document.getElementById('s-name').innerText = document.getElementById('in-name').value || "Unnamed Hero";\
        document.getElementById('s-sub').innerText = `LVL $\{lv\} $\{race?.name || ""\} $\{cls?.name || ""\} ($\{sub\})`.toUpperCase();\
        document.getElementById('s-prof').innerText = `+$\{prof\}`;\
\
        const reg = document.getElementById('registry-tags'); reg.innerHTML = '';\
        ['feats','items'].forEach(type => this.state[type].forEach(k => \{\
            reg.innerHTML += `<div class="tag">$\{k\} <span onclick="Sovereign.state['$\{type\}'].delete('$\{k\}');Sovereign.sync()" style="cursor:pointer; color:red;">&times;</span></div>`;\
        \}));\
\
        Persistence.autoSave(\{\
            name: document.getElementById('in-name').value, lv, race: document.getElementById('in-race').value, class: clsKey,\
            subclass: sub, stats: Array.from(document.querySelectorAll('.st-in')).map(i => i.value),\
            feats: Array.from(this.state.feats), items: Array.from(this.state.items),\
            custom: this.state.custom, skillStates: this.state.skillStates\
        \});\
    \},\
\
    renderResources(cls, lv, mods, prof, sub) \{\
        const resUI = document.getElementById('s-res'); resUI.innerHTML = '';\
        const addRes = (label, count) => \{\
            if (count <= 0) return;\
            let b = ''; for(let x=0; x<count; x++) b += '<input type="checkbox">';\
            resUI.innerHTML += `<div class="res-item"><small>$\{label\}</small><div class="checkbox-group">$\{b\}</div></div>`;\
        \};\
\
        addRes(`$\{lv\}d$\{cls?.hd || 8\} HD`, lv);\
        const cAbility = cls?.spellcastingAbility || "INT";\
        const modV = mods[cAbility] || 0;\
        \
        let limitText = "";\
        if(cls?.spellcastingFactor || sub.includes("Eldritch") || sub.includes("Arcane")) \{\
            limitText = `DC $\{8+prof+modV\} | ATK +$\{prof+modV\}`;\
        \}\
        document.getElementById('s-cast-stats').innerText = limitText;\
\
        let finalAC = 10 + mods.DEX;\
        const cName = cls?.name?.toLowerCase() || "";\
        if(cName.includes("barbarian")) finalAC += mods.CON;\
        if(cName.includes("monk")) finalAC += mods.WIS;\
        document.getElementById('s-ac').innerText = finalAC;\
\
        if(cName.includes("barbarian")) addRes("Rages", lv>=17?6: (lv>=12?5: (lv>=6?4: (lv>=3?3:2))));\
        if(cName.includes("monk")) addRes("Ki Points", lv);\
        if(cName.includes("sorcerer")) addRes("Sorcery Pts", lv);\
        if(cName.includes("bard")) addRes("Inspirations", Math.max(1, mods.CHA));\
        if(cName.includes("fighter")) \{\
            addRes("Second Wind", 1);\
            if(lv>=9) addRes("Indomitable", lv>=17?3:(lv>=13?2:1));\
            if(sub.includes("Battle Master")) addRes("Superiority", lv>=15?6:(lv>=7?5:4));\
        \}\
\
        const tables = \{\
            full: [[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]],\
            half: [null,[2],[2],[3,2],[3,2],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2]],\
            third:[null,null,[2],[3],[3],[3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1]]\
        \};\
        \
        const factor = cls?.spellcastingFactor || 0;\
        if(factor === 1) tables.full[lv-1].forEach((n,i) => addRes(`L$\{i+1\}`, n));\
        else if(factor === 2 && lv >= 2) tables.half[lv-1].forEach((n,i) => addRes(`L$\{i+1\}`, n));\
        else if(sub.includes("Eldritch") || sub.includes("Arcane")) \{ if(lv >= 3) tables.third[lv-1].forEach((n,i) => addRes(`L$\{i+1\}`, n)); \}\
        else if(cName.includes("warlock")) \{\
            const s = lv>=17?4:(lv>=11?3:(lv>=2?2:1));\
            addRes(`Pact L$\{lv>=9?5:(lv>=7?4:(lv>=5?3:(lv>=3?2:1)))\}`, s);\
        \}\
    \},\
\
    toggleSidebar() \{\
        const sb = document.getElementById('main-sidebar');\
        sb.classList.toggle('active');\
        document.getElementById('mobile-toggle').innerText = sb.classList.contains('active') ? "\uc0\u10005  Close" : "\u9776  Edit Hero";\
    \},\
\
    applyUI(d) \{\
        document.getElementById('in-name').value = d.name || "";\
        document.getElementById('in-lv').value = d.lv || 1;\
        document.getElementById('in-race').value = d.race || "human";\
        document.getElementById('in-class').value = d.class || "fighter";\
        const inputs = document.querySelectorAll('.st-in');\
        if(d.stats) d.stats.forEach((v, i) => \{ if(inputs[i]) inputs[i].value = v; \});\
    \},\
\
    toggleSkill(n) \{\
        const cycle = [0, 0.5, 1, 2];\
        const cur = this.state.skillStates[n] || 0;\
        this.state.skillStates[n] = cycle[(cycle.indexOf(cur) + 1) % 4];\
        this.sync();\
    \},\
\
    add(t) \{ this.state[t].add(document.getElementById(`sel-$\{t.slice(0,-1)\}`).value); this.sync(); \},\
    addCustom() \{\
        const n = document.getElementById('c-name').value;\
        if(n) \{ this.state.custom.push(\{n\}); this.sync(); document.getElementById('c-name').value = ''; \}\
    \},\
    exportJSON() \{\
        const a = document.createElement('a');\
        a.href = URL.createObjectURL(new Blob([localStorage.getItem(Persistence.SAVE_KEY)], \{type:'application/json'\}));\
        a.download='hero.json'; a.click();\
    \},\
    importJSON() \{\
        const fr = new FileReader(); const inp = document.createElement('input'); inp.type='file';\
        inp.onchange = e => \{ fr.onload = ev => \{ localStorage.setItem(Persistence.SAVE_KEY, ev.target.result); location.reload(); \}; fr.readAsText(e.target.files[0]); \}; inp.click();\
    \}\
\};\
\
window.onload = () => Sovereign.init();\
}