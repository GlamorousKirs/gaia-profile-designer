import presetHTML5 from '@bbob/preset-html5'

export const customPreset = presetHTML5.extend((tags: any) => ({
    ...tags,
    spoiler: (node: any) => ({
        tag: 'div',
        attrs: { class: 'spoiler-wrapper spoiler-hidden' },
        content: [
            {
                tag: 'div',
                attrs: { class: 'spoiler-title' },
                content: [
                    {
                        tag: 'button',
                        attrs: { type: 'button', class: 'spoiler-control spoiler-control-show cta-button-sm gray-button' },
                        content: [{ tag: 'span', content: 'show spoiler' }]
                    },
                    {
                        tag: 'button',
                        attrs: { type: 'button', class: 'spoiler-control spoiler-control-hide cta-button-sm gray-button' },
                        content: [{ tag: 'span', content: 'hide spoiler' }]
                    }
                ]
            },
            { tag: 'div', attrs: { class: 'spoiler' }, content: node.content }
        ]
    }),
    youtube: (node: any) => {
        const url = node.content[0] || '';
        const videoId = url.includes('v=')
            ? url.split('v=')[1].split('&')[0]
            : url.split('/').pop();

        return {
            tag: 'iframe',
            attrs: {
                width: '470',
                height: '264',
                src: `https://www.youtube-nocookie.com/embed/${videoId}?&mute=0&autoplay=0`,
                frameborder: '0',
                loading: 'lazy',
                allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: '',
                'data-ruffle-polyfilled': ''
            }
        };
    }
}));