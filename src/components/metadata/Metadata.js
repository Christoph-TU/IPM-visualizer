import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { useSignal } from "@preact/signals";
import { AppStateContext } from '/src/state/AppStateContext.js';
import './Metadata.css';

const JsonViewer = ({ data }) => {
    if (typeof data === 'object' && data !== null) {
        return (
            <ul>
                {Object.keys(data).map(key => (
                    <li key={key}>
                        <strong>{key}:</strong> <JsonViewer data={data[key]} />
                    </li>
                ))}
            </ul>
        );
    } else {
        return <span>{String(data)}</span>;
    }
};

export function Metadata() {
    const { parsedDisplay } = useContext(AppStateContext);

    const content = parsedDisplay.value.file;
    const performance = content.regions[0].performance;

    const isExpanded = useSignal(false);

    const locale = navigator.language || 'en-US';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat(locale, options).format;

    return (<>
        <table class='metadata-table'>
            <tr>
                <td>Command</td>
                <td>{content.metadata.cmdline}</td>
            </tr>
        </table>
        <div class='metadata-container'>
            <table class='metadata-table'>
                <tr>
                    <td>User</td>
                    <td>{content.metadata.username}</td>
                </tr>
                <tr>
                    <td>Start</td>
                    <td>{formatter(new Date(content.metadata.start * 1000))}</td>
                </tr>
                <tr>
                    <td>Stop</td>
                    <td>{formatter(new Date(content.metadata.stop * 1000))}</td>
                </tr>
                <tr>
                    <td>Total Memory</td>
                    <td>{performance.totalValues.gbyte.toFixed(6)} GB</td>
                </tr>
            </table>
            <table class='metadata-table'>
                <tr>
                    <td>IPM Version</td>
                    <td>{content.metadata.ipm_version}</td>
                </tr>
                <tr>
                    <td>MPI Tasks</td>
                    <td>{content.metadata.ntasks + ' on ' + content.metadata.nhosts + ' hosts'}</td>
                </tr>
                <tr>
                    <td>Wallcock</td>
                    <td>{content.metadata.walltime} seconds</td>
                </tr>
                <tr>
                    <td>Total GFlop/sec</td>
                    <td>{performance.totalValues.gflop.toFixed(6)}</td>
                </tr>

            </table>
        </div>
        { content.metadata.env &&
            <table className="metadata-table">
                <tr>
                    <td>Environment</td>
                    <td style='line-break: anywhere'>
                        {content.metadata.env ? (
                            <>
                                <button onClick={() => isExpanded.value = !isExpanded.value}>{isExpanded.value ? 'Collapse' : 'Expand'}</button>
                                {isExpanded.value && <JsonViewer data={content.metadata.env} />}
                            </>
                        ) : (
                            'N/A'
                        )}
                    </td>
                </tr>
            </table>
        }
    </>
    );
}